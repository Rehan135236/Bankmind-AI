from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


# --- Provider Schemas ---
class ProviderBase(BaseModel):
    id: str
    name: str
    provider_type: str
    website_url: str
    description: Optional[str] = None
    helpline: Optional[str] = None
    official_channels: Optional[Dict[str, Any]] = None
    is_active: bool = True


class ProviderResponse(ProviderBase):
    document_count: Optional[int] = 0

    class Config:
        from_attributes = True


# --- Document & Source Schemas ---
class SourceRegisterRequest(BaseModel):
    provider_id: str
    title: str
    source_url: str
    document_type: str = "guide"
    publication_date: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    verification_status: str = "verified"  # verified, unverified, historical
    content_text: Optional[str] = None  # If registering with direct text payload


class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    content: str
    content_hash: str
    chroma_id: str

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: str
    provider_id: str
    title: str
    source_url: str
    document_type: str
    publication_date: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    retrieval_date: datetime
    language: str
    verification_status: str
    content_hash: str
    is_scanned_ocr_required: bool
    chunk_count: int
    ingestion_status: str
    last_indexed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    extracted_text_preview: Optional[str] = None
    chunks: List[DocumentChunkResponse] = []


class DocumentStatusUpdate(BaseModel):
    verification_status: str  # verified, unverified, historical


# --- Ingestion Schemas ---
class IngestionReportResponse(BaseModel):
    success: bool
    document_id: str
    title: str
    chunks_created: int
    processing_time_seconds: float
    status: str
    is_scanned_ocr_required: bool
    error_message: Optional[str] = None


class IngestionJobResponse(BaseModel):
    id: str
    document_id: str
    status: str
    chunks_created: int
    error_message: Optional[str] = None
    processing_time_seconds: float
    created_at: datetime

    class Config:
        from_attributes = True


# --- Chat & RAG Schemas ---
class CitationItem(BaseModel):
    provider_id: str
    provider_name: str
    document_id: str
    document_title: str
    source_url: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    excerpt: str
    similarity_score: float
    verification_status: str = "verified"


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=1500)
    provider_id: Optional[str] = None  # None for general banking mode
    conversation_id: Optional[str] = None
    top_k: Optional[int] = 4


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    citations: List[CitationItem]
    retrieval_mode: str  # "retrieval_only", "llm_groq", "abstention"
    provider_id: Optional[str] = None
    latency_ms: int
    abstention: bool = False
    warning: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender: str
    content: str
    provider_id: Optional[str] = None
    citations: Optional[List[CitationItem]] = None
    retrieval_mode: Optional[str] = None
    latency_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    provider_id: Optional[str] = None
    title: str
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    message_id: str
    is_helpful: bool
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    message_id: str
    is_helpful: bool
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Analytics Schemas ---
class ProviderStatItem(BaseModel):
    provider_id: str
    name: str
    question_count: int
    document_count: int


class TopicStatItem(BaseModel):
    topic: str
    count: int


class AnalyticsOverviewResponse(BaseModel):
    total_questions: int
    questions_by_provider: List[ProviderStatItem]
    top_topics: List[TopicStatItem]
    retrieval_success_rate: float
    unsupported_abstention_rate: float
    citation_coverage: float
    positive_feedback_rate: float
    average_latency_ms: float
    is_synthetic_notice: str = "Real-time query metrics from local test execution and user interaction."


# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_email: str
    role: str
