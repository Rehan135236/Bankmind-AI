import os
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from app.models.models import Provider, Document, DocumentChunk, IngestionJob, AuditLog
from app.rag.extractor import DocumentExtractor, compute_content_hash
from app.rag.chunker import SemanticChunker
from app.rag.vector_store import VectorStoreService

INITIAL_PROVIDERS = [
    {
        "id": "easypaisa",
        "name": "Easypaisa",
        "provider_type": "branchless_banking",
        "website_url": "https://easypaisa.com.pk/",
        "description": "Telenor Microfinance Bank's flagship branchless banking service with nationwide Raast P2P and mobile wallet capabilities.",
        "helpline": "3737 (Telenor) / 042-111-003737 (Other Networks)",
        "official_channels": {"email": "support@easypaisa.com.pk", "app": "Easypaisa App"}
    },
    {
        "id": "jazzcash",
        "name": "JazzCash",
        "provider_type": "branchless_banking",
        "website_url": "https://www.jazzcash.com.pk/",
        "description": "Mobilink Microfinance Bank's branchless banking platform offering digital wallets, Raast payments, and merchant solutions.",
        "helpline": "4444 (Jazz) / 021-111-124-444 (Other Networks)",
        "official_channels": {"email": "complaints@jazzcash.com.pk", "app": "JazzCash App"}
    },
    {
        "id": "meezan",
        "name": "Meezan Bank",
        "provider_type": "islamic_bank",
        "website_url": "https://www.meezanbank.com/",
        "description": "The premier and largest Islamic Commercial Bank in Pakistan, offering Shariah-compliant retail and digital banking solutions.",
        "helpline": "+92 (21) 111-331-331 / 111-331-332",
        "official_channels": {"email": "info@meezanbank.com", "app": "Meezan Mobile"}
    },
    {
        "id": "hbl",
        "name": "Habib Bank Limited (HBL)",
        "provider_type": "commercial_bank",
        "website_url": "https://www.hbl.com/",
        "description": "Pakistan's largest commercial bank offering comprehensive consumer accounts, HBL Freedom Account, and digital payments.",
        "helpline": "111-111-425 / +92 (21) 111-111-425",
        "official_channels": {"email": "customer.support@hbl.com", "app": "HBL Mobile"}
    },
    {
        "id": "alfalah",
        "name": "Bank Alfalah",
        "provider_type": "commercial_bank",
        "website_url": "https://www.bankalfalah.com/",
        "description": "Leading digital-forward commercial bank known for the Alfa financial app, consumer accounts, and Raast integration.",
        "helpline": "021-111-225-111",
        "official_channels": {"email": "contactus@bankalfalah.com", "app": "Alfa"}
    },
    {
        "id": "sbp",
        "name": "State Bank of Pakistan (SBP)",
        "provider_type": "regulator",
        "website_url": "https://www.sbp.org.pk/",
        "description": "The central bank and regulatory authority of Pakistan governing monetary policy, payment systems (Raast), and consumer protection.",
        "helpline": "Sunwai Portal (sunwai.sbp.org.pk)",
        "official_channels": {"portal": "https://sunwai.sbp.org.pk"}
    }
]

SEED_FILES = [
    {
        "provider_id": "easypaisa",
        "title": "Easypaisa Raast & Account Service Guide (Current)",
        "source_url": "https://easypaisa.com.pk/Send-Money-through-RAAST/",
        "document_type": "faq",
        "effective_date": "2024-07-01",
        "verification_status": "verified",
        "path": "backend/app/data/seeds/easypaisa_official.md"
    },
    {
        "provider_id": "jazzcash",
        "title": "JazzCash Mobile Account & Raast Guide (Current)",
        "source_url": "https://www.jazzcash.com.pk/account",
        "document_type": "guide",
        "effective_date": "2024-07-01",
        "verification_status": "verified",
        "path": "backend/app/data/seeds/jazzcash_official.md"
    },
    {
        "provider_id": "meezan",
        "title": "Meezan Bank Islamic Banking Products & Raast Services",
        "source_url": "https://www.meezanbank.com/personal-banking/",
        "document_type": "policy",
        "effective_date": "2024-07-01",
        "verification_status": "verified",
        "path": "backend/app/data/seeds/meezan_official.md"
    },
    {
        "provider_id": "hbl",
        "title": "HBL Freedom Account & Digital Banking Policy",
        "source_url": "https://www.hbl.com/personal/accounts/freedom-account",
        "document_type": "policy",
        "effective_date": "2024-07-01",
        "verification_status": "verified",
        "path": "backend/app/data/seeds/hbl_official.md"
    },
    {
        "provider_id": "alfalah",
        "title": "Bank Alfalah Alfa Digital Banking & Schedule of Charges",
        "source_url": "https://www.bankalfalah.com/digital-banking/schedule-of-charges/",
        "document_type": "schedule_of_charges",
        "effective_date": "2024-07-01",
        "verification_status": "verified",
        "path": "backend/app/data/seeds/alfalah_official.md"
    },
    {
        "provider_id": "sbp",
        "title": "State Bank of Pakistan Raast & Consumer Protection Directives",
        "source_url": "https://www.sbp.org.pk/dfs/Payments.html",
        "document_type": "circular",
        "effective_date": "2023-01-01",
        "verification_status": "verified",
        "path": "backend/app/data/seeds/sbp_regulatory.md"
    },
    {
        "provider_id": "easypaisa",
        "title": "Easypaisa Schedule of Charges (2021 Historical Archive)",
        "source_url": "https://easypaisa.com.pk/archive/soc-2021.pdf",
        "document_type": "historical_archive",
        "effective_date": "2021-01-01",
        "expiry_date": "2021-12-31",
        "verification_status": "historical",
        "path": "backend/app/data/seeds/easypaisa_historical_2021.md"
    }
]


class DocumentService:
    @staticmethod
    async def initialize_providers_and_seeds(db: AsyncSession):
        """
        Seeds initial providers and standard verified banking sources.
        """
        # 1. Seed providers
        for p_data in INITIAL_PROVIDERS:
            result = await db.execute(select(Provider).where(Provider.id == p_data["id"]))
            existing = result.scalar_one_or_none()
            if not existing:
                provider = Provider(**p_data)
                db.add(provider)
        await db.commit()

        # 2. Seed documents
        for seed in SEED_FILES:
            result = await db.execute(select(Document).where(Document.source_url == seed["source_url"]))
            existing_doc = result.scalar_one_or_none()
            if not existing_doc:
                file_path = seed["path"]
                if os.path.exists(file_path):
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    content_hash = compute_content_hash(content)
                    doc = Document(
                        provider_id=seed["provider_id"],
                        title=seed["title"],
                        source_url=seed["source_url"],
                        document_type=seed["document_type"],
                        effective_date=seed.get("effective_date"),
                        expiry_date=seed.get("expiry_date"),
                        verification_status=seed.get("verification_status", "verified"),
                        content_hash=content_hash,
                        file_path=file_path,
                        extracted_text_preview=content[:600],
                        ingestion_status="pending"
                    )
                    db.add(doc)
                    await db.commit()
                    await db.refresh(doc)
                    
                    # Ingest this document
                    await DocumentService.ingest_document(db, doc.id, content=content, extension=".md")

    @staticmethod
    async def ingest_document(
        db: AsyncSession,
        document_id: str,
        content: Optional[str] = None,
        file_path: Optional[str] = None,
        extension: str = ".txt",
        performed_by: str = "system"
    ) -> Dict[str, Any]:
        start_time = time.time()
        result = await db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise ValueError(f"Document {document_id} not found")

        job = IngestionJob(document_id=doc.id, status="in_progress")
        db.add(job)
        await db.commit()

        try:
            target = file_path or content or doc.file_path or ""
            pages_data, is_scanned = DocumentExtractor.extract(target, extension)

            if not pages_data or not any(p.get("text") for p in pages_data):
                raise ValueError("No readable text could be extracted from document.")

            doc.is_scanned_ocr_required = is_scanned

            # Prepare metadata for chunker
            result_provider = await db.execute(select(Provider).where(Provider.id == doc.provider_id))
            provider = result_provider.scalar_one_or_none()
            provider_name = provider.name if provider else doc.provider_id.title()

            doc_metadata = {
                "document_id": doc.id,
                "document_title": doc.title,
                "provider_id": doc.provider_id,
                "provider_name": provider_name,
                "source_url": doc.source_url,
                "effective_date": doc.effective_date or "",
                "expiry_date": doc.expiry_date or "",
                "verification_status": doc.verification_status,
            }

            chunker = SemanticChunker()
            chunks_data = chunker.chunk_document(pages_data, doc_metadata)

            # Clear existing chunks from DB and Chroma
            VectorStoreService.delete_document(doc.id)
            await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))

            # Store in ChromaDB
            VectorStoreService.add_chunks(chunks_data)

            # Store in Database
            for c in chunks_data:
                chunk_record = DocumentChunk(
                    document_id=doc.id,
                    provider_id=doc.provider_id,
                    chunk_index=c["chunk_index"],
                    page_number=c.get("page_number", 1),
                    section_title=c.get("section_title"),
                    content=c["content"],
                    content_hash=c["content_hash"],
                    chroma_id=f"{doc.id}_{c['chunk_index']}"
                )
                db.add(chunk_record)

            # Update document stats
            doc.chunk_count = len(chunks_data)
            doc.ingestion_status = "indexed"
            doc.last_indexed_at = datetime.utcnow()
            if not doc.extracted_text_preview and pages_data:
                doc.extracted_text_preview = pages_data[0]["text"][:600]

            job.status = "completed"
            job.chunks_created = len(chunks_data)
            job.processing_time_seconds = round(time.time() - start_time, 2)

            # Audit log
            audit = AuditLog(
                action="document_ingest",
                target_id=doc.id,
                details=f"Ingested {len(chunks_data)} chunks for '{doc.title}'",
                performed_by=performed_by
            )
            db.add(audit)
            await db.commit()

            return {
                "success": True,
                "document_id": doc.id,
                "title": doc.title,
                "chunks_created": len(chunks_data),
                "processing_time_seconds": job.processing_time_seconds,
                "status": "indexed",
                "is_scanned_ocr_required": is_scanned
            }

        except Exception as e:
            await db.rollback()
            job.status = "failed"
            job.error_message = str(e)
            job.processing_time_seconds = round(time.time() - start_time, 2)
            doc.ingestion_status = "failed"
            db.add(job)
            db.add(doc)
            await db.commit()
            return {
                "success": False,
                "document_id": doc.id,
                "title": doc.title,
                "chunks_created": 0,
                "processing_time_seconds": job.processing_time_seconds,
                "status": "failed",
                "is_scanned_ocr_required": False,
                "error_message": str(e)
            }

    @staticmethod
    async def delete_document(db: AsyncSession, document_id: str, performed_by: str = "system"):
        result = await db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise ValueError(f"Document {document_id} not found")

        VectorStoreService.delete_document(doc.id)
        title = doc.title
        await db.delete(doc)

        audit = AuditLog(
            action="document_delete",
            target_id=document_id,
            details=f"Deleted document '{title}' and removed vector entries",
            performed_by=performed_by
        )
        db.add(audit)
        await db.commit()
        return True

    @staticmethod
    async def update_verification_status(
        db: AsyncSession,
        document_id: str,
        new_status: str,
        performed_by: str = "system"
    ):
        result = await db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise ValueError(f"Document {document_id} not found")

        doc.verification_status = new_status
        audit = AuditLog(
            action="status_change",
            target_id=doc.id,
            details=f"Changed status of '{doc.title}' to {new_status}",
            performed_by=performed_by
        )
        db.add(audit)
        await db.commit()

        # Re-index to sync status in ChromaDB
        if doc.file_path and os.path.exists(doc.file_path):
            _, ext = os.path.splitext(doc.file_path)
            await DocumentService.ingest_document(db, doc.id, file_path=doc.file_path, extension=ext)
        return doc
