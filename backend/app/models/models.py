import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Provider(Base):
    __tablename__ = "providers"

    id = Column(String(50), primary_key=True)  # e.g., "easypaisa", "jazzcash", "meezan", "hbl", "alfalah", "sbp"
    name = Column(String(100), nullable=False)
    provider_type = Column(String(50), nullable=False)  # branchless_banking, islamic_bank, commercial_bank, regulator
    website_url = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    helpline = Column(String(100), nullable=True)
    official_channels = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)

    documents = relationship("Document", back_populates="provider", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_id = Column(String(50), ForeignKey("providers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=False)
    document_type = Column(String(50), nullable=False)  # schedule_of_charges, faq, policy, circular, guide
    publication_date = Column(String(50), nullable=True)
    effective_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    retrieval_date = Column(DateTime, default=datetime.utcnow)
    language = Column(String(10), default="en")
    verification_status = Column(String(20), default="verified")  # verified, unverified, historical
    content_hash = Column(String(64), nullable=False)
    file_path = Column(String(500), nullable=True)
    is_scanned_ocr_required = Column(Boolean, default=False)
    extracted_text_preview = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    ingestion_status = Column(String(20), default="pending")  # pending, indexed, failed
    last_indexed_at = Column(DateTime, nullable=True)

    provider = relationship("Provider", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    ingestion_jobs = relationship("IngestionJob", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    provider_id = Column(String(50), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=True)
    section_title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False)
    chroma_id = Column(String(100), nullable=False)

    document = relationship("Document", back_populates="chunks")


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    status = Column(String(20), default="in_progress")  # in_progress, completed, failed
    chunks_created = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    processing_time_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="ingestion_jobs")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_id = Column(String(50), nullable=True)  # null = general banking mode
    title = Column(String(255), default="New Banking Inquiry")
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    sender = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    provider_id = Column(String(50), nullable=True)
    citations = Column(JSON, nullable=True)
    retrieval_mode = Column(String(30), nullable=True)  # retrieval_only, llm_groq, abstention
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    feedback = relationship("Feedback", back_populates="message", uselist=False, cascade="all, delete-orphan")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    message_id = Column(String(36), ForeignKey("messages.id"), nullable=False)
    is_helpful = Column(Boolean, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="feedback")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(50), nullable=False)  # upload, ingest, reindex, delete, status_change
    target_id = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    performed_by = Column(String(100), default="system")
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="admin")  # admin, user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
