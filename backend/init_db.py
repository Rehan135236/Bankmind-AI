import asyncio
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import async_engine, Base, AsyncSessionLocal
from app.services.document_service import DocumentService


async def main():
    print(">>> Initializing database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(">>> Tables created.")

    print(">>> Seeding providers and verified documents into database and ChromaDB...")
    async with AsyncSessionLocal() as session:
        await DocumentService.initialize_providers_and_seeds(session)
    print(">>> Ingestion complete! Knowledge base is fully indexed.")


if __name__ == "__main__":
    asyncio.run(main())
