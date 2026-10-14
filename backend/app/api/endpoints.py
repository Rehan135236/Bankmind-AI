import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    get_current_admin,
    check_rate_limit,
    create_access_token,
    verify_password
)
from app.models.models import Provider, Document, DocumentChunk, Conversation, Message, Feedback, AuditLog, User
from app.schemas.schemas import (
    ProviderResponse,
    DocumentResponse,
    DocumentDetailResponse,
    SourceRegisterRequest,
    IngestionReportResponse,
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    FeedbackCreate,
    FeedbackResponse,
    AnalyticsOverviewResponse,
    LoginRequest,
    TokenResponse,
    DocumentStatusUpdate,
)
from app.services.document_service import DocumentService
from app.services.chat_service import ChatService
from app.rag.extractor import compute_content_hash

router = APIRouter()


# --- Auth Endpoint ---
@router.post("/auth/login", response_model=TokenResponse)
async def login_for_access_token(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Check default admin credentials or database user
    if payload.email == settings.ADMIN_USERNAME and payload.password == settings.ADMIN_PASSWORD:
        token = create_access_token({"sub": payload.email, "role": "admin"})
        return TokenResponse(
            access_token=token,
            user_email=payload.email,
            role="admin"
        )
    
    # Or query user table
    res = await db.execute(select(User).where(User.email == payload.email))
    user = res.scalar_one_or_none()
    if user and verify_password(payload.password, user.hashed_password):
        token = create_access_token({"sub": user.email, "role": user.role})
        return TokenResponse(
            access_token=token,
            user_email=user.email,
            role=user.role
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


# --- Providers ---
@router.get("/providers", response_model=List[ProviderResponse])
async def list_providers(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Provider))
    providers = res.scalars().all()
    
    output = []
    for p in providers:
        doc_count_res = await db.execute(
            select(Document).where(Document.provider_id == p.id)
        )
        docs = doc_count_res.scalars().all()
        p_dict = {
            "id": p.id,
            "name": p.name,
            "provider_type": p.provider_type,
            "website_url": p.website_url,
            "description": p.description,
            "helpline": p.helpline,
            "official_channels": p.official_channels,
            "is_active": p.is_active,
            "document_count": len(docs)
        }
        output.append(ProviderResponse(**p_dict))
    return output


# --- Sources & Documents ---
@router.get("/sources", response_model=List[DocumentResponse])
async def list_documents(
    provider_id: Optional[str] = None,
    verification_status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).order_by(desc(Document.retrieval_date))
    if provider_id and provider_id != "general":
        query = query.where(Document.provider_id == provider_id)
    if verification_status:
        query = query.where(Document.verification_status == verification_status)
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/sources/{document_id}", response_model=DocumentDetailResponse)
async def get_document_detail(document_id: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Document)
        .where(Document.id == document_id)
        .options(selectinload(Document.chunks))
    )
    res = await db.execute(query)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/sources", response_model=DocumentResponse)
async def register_source_url(
    payload: SourceRegisterRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    content = payload.content_text or f"# {payload.title}\nSource: {payload.source_url}\nOfficial Document"
    content_hash = compute_content_hash(content)

    doc = Document(
        provider_id=payload.provider_id,
        title=payload.title,
        source_url=payload.source_url,
        document_type=payload.document_type,
        publication_date=payload.publication_date,
        effective_date=payload.effective_date,
        expiry_date=payload.expiry_date,
        verification_status=payload.verification_status,
        content_hash=content_hash,
        extracted_text_preview=content[:600],
        ingestion_status="pending"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Ingest text directly
    await DocumentService.ingest_document(
        db, doc.id, content=content, extension=".txt", performed_by=admin.get("sub", "admin")
    )
    await db.refresh(doc)
    return doc


@router.post("/documents/upload", response_model=IngestionReportResponse)
async def upload_document(
    provider_id: str = Form(...),
    title: str = Form(...),
    source_url: str = Form(...),
    document_type: str = Form("guide"),
    effective_date: Optional[str] = Form(None),
    verification_status: str = Form("verified"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # Validate extension
    filename = file.filename or ""
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB"
        )

    # Check magic bytes for PDF
    if ext == ".pdf" and not contents.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file: Missing %PDF file signature."
        )

    # Save to disk
    os.makedirs("./uploads", exist_ok=True)
    save_path = os.path.join("./uploads", f"{provider_id}_{filename}")
    with open(save_path, "wb") as f:
        f.write(contents)

    content_hash = compute_content_hash(contents)

    doc = Document(
        provider_id=provider_id,
        title=title,
        source_url=source_url,
        document_type=document_type,
        effective_date=effective_date,
        verification_status=verification_status,
        content_hash=content_hash,
        file_path=save_path,
        ingestion_status="pending"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Run Ingestion
    report = await DocumentService.ingest_document(
        db, doc.id, file_path=save_path, extension=ext, performed_by=admin.get("sub", "admin")
    )
    return IngestionReportResponse(**report)


@router.post("/documents/{document_id}/ingest", response_model=IngestionReportResponse)
@router.post("/documents/{document_id}/reindex", response_model=IngestionReportResponse)
async def reindex_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    res = await db.execute(select(Document).where(Document.id == document_id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = doc.file_path
    ext = os.path.splitext(file_path)[1] if file_path else ".txt"
    report = await DocumentService.ingest_document(
        db, doc.id, file_path=file_path, extension=ext, performed_by=admin.get("sub", "admin")
    )
    return IngestionReportResponse(**report)


@router.put("/documents/{document_id}/status", response_model=DocumentResponse)
async def update_document_status(
    document_id: str,
    payload: DocumentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    if payload.verification_status not in ["verified", "unverified", "historical"]:
        raise HTTPException(status_code=400, detail="Invalid verification status")

    try:
        updated_doc = await DocumentService.update_verification_status(
            db, document_id, payload.verification_status, performed_by=admin.get("sub", "admin")
        )
        return updated_doc
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    try:
        await DocumentService.delete_document(
            db, document_id, performed_by=admin.get("sub", "admin")
        )
        return {"success": True, "message": "Document and associated embeddings deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- Chat Endpoints ---
@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    payload: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Apply rate limiting
    check_rate_limit(request)

    response = await ChatService.process_user_query(
        db=db,
        query=payload.message,
        provider_id=payload.provider_id,
        conversation_id=payload.conversation_id,
        top_k=payload.top_k or 4
    )
    return response


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    return await ChatService.list_conversations(db, limit, offset)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_single_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    conv = await ChatService.get_conversation_history(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


# --- Feedback Endpoint ---
@router.post("/feedback", response_model=FeedbackResponse)
async def submit_chat_feedback(payload: FeedbackCreate, db: AsyncSession = Depends(get_db)):
    try:
        feedback = await ChatService.submit_feedback(
            db, payload.message_id, payload.is_helpful, payload.comment
        )
        return feedback
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- Analytics Endpoint ---
@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics(db: AsyncSession = Depends(get_db)):
    return await ChatService.get_analytics_metrics(db)


# --- Audit Logs Endpoint ---
@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    query = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()
