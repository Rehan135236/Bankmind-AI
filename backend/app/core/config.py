import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "BankMate AI"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./bankmate.db"
    SYNC_DATABASE_URL: str = "sqlite:///./bankmate.db"
    
    # Vector DB (Pinecone Cloud or Local ChromaDB)
    VECTOR_STORE_BACKEND: str = "auto"
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "bankmate-ai"
    PINECONE_ENVIRONMENT: str = "us-east-1"
    CHROMA_PERSIST_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "chroma_db"))
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 700
    CHUNK_OVERLAP: int = 120
    DEFAULT_TOP_K: int = 4
    SIMILARITY_THRESHOLD: float = 0.35
    
    # LLM Settings (Groq API or Retrieval-only)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # Security & Auth
    SECRET_KEY: str = "bankmate-ai-super-secret-production-quality-token-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ADMIN_USERNAME: str = "admin@bankmate.ai"
    ADMIN_PASSWORD: str = "BankMateAdmin2026!"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    # File limits
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".txt", ".md", ".html"]
    
    class Config:
        env_file = (
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")),
            ".env"
        )
        extra = "ignore"

    def get_async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Ensure ssl=require for asyncpg
        if "sslmode=require" in url and "asyncpg" in url:
            url = url.replace("sslmode=require", "ssl=require")
        if "channel_binding=" in url:
            import re
            url = re.sub(r"&?channel_binding=[^&]+", "", url)
        return url

    def get_sync_database_url(self) -> str:
        url = self.SYNC_DATABASE_URL or self.DATABASE_URL
        if url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        if "sqlite+aiosqlite:///" in url:
            url = url.replace("sqlite+aiosqlite:///", "sqlite:///", 1)
        if "channel_binding=" in url:
            import re
            url = re.sub(r"&?channel_binding=[^&]+", "", url)
        return url


settings = Settings()
