import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import async_engine, Base, AsyncSessionLocal
from app.api.endpoints import router as api_router
from app.services.document_service import DocumentService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bankmate.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BankMate AI Database & Seed Data...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Initialize Seed Providers and Verified Documents
    async with AsyncSessionLocal() as session:
        try:
            await DocumentService.initialize_providers_and_seeds(session)
            logger.info("Providers & Knowledge Base Seeds initialized successfully.")
        except Exception as e:
            logger.error(f"Error during seed initialization: {e}")

    yield

    logger.info("Shutting down BankMate AI Backend...")


app = FastAPI(
    title="BankMate AI — Multi-Bank Intelligent Banking Support Agent",
    description="Production-grade RAG support system for Pakistan's banking & fintech sector.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "rag_mode": "llm_groq" if settings.GROQ_API_KEY else "grounded_retrieval_only",
        "vector_store": "ChromaDB (Persistent)",
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "version": "1.0.0"
    }


# Global Exception Handler for safe error reporting
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred while processing your banking query. Please try again later."
        }
    )


# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
