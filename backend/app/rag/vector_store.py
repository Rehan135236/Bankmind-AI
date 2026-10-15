import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.rag.embeddings import embed_texts, embed_query

logger = logging.getLogger("bankmate.rag.vector_store")

_chroma_client = None
_collection = None
_pinecone_client = None
_pinecone_index = None

COLLECTION_NAME = "bankmate_knowledge_base"


def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
    return _chroma_client


def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


def get_pinecone_index():
    global _pinecone_client, _pinecone_index
    if not settings.PINECONE_API_KEY or not settings.PINECONE_API_KEY.strip():
        return None

    if _pinecone_index is None:
        try:
            from pinecone import Pinecone, ServerlessSpec
            _pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
            index_name = settings.PINECONE_INDEX_NAME

            existing_indexes = [i.name for i in _pinecone_client.list_indexes()]
            if index_name not in existing_indexes:
                logger.info(f"Creating Pinecone serverless index '{index_name}'...")
                _pinecone_client.create_index(
                    name=index_name,
                    dimension=384,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=settings.PINECONE_ENVIRONMENT or "us-east-1"
                    )
                )

            _pinecone_index = _pinecone_client.Index(index_name)
            logger.info(f"Connected to Pinecone index: '{index_name}'")
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {e}", exc_info=True)
            _pinecone_index = None

    return _pinecone_index


class VectorStoreService:
    @staticmethod
    def is_pinecone_active() -> bool:
        if settings.VECTOR_STORE_BACKEND == "chroma":
            return False
        return bool(settings.PINECONE_API_KEY and get_pinecone_index() is not None)

    @staticmethod
    def get_backend_name() -> str:
        if VectorStoreService.is_pinecone_active():
            return f"Pinecone Serverless ({settings.PINECONE_INDEX_NAME} - {settings.PINECONE_ENVIRONMENT})"
        return "ChromaDB Persistent (Local)"

    @staticmethod
    def add_chunks(chunks: List[Dict[str, Any]]) -> List[str]:
        if not chunks:
            return []

        texts = [c["content"] for c in chunks]
        embeddings = embed_texts(texts)

        ids = []
        metadatas = []
        documents = []

        for idx, chunk in enumerate(chunks):
            chunk_id = f"{chunk['document_id']}_{chunk['chunk_index']}"
            ids.append(chunk_id)
            documents.append(chunk["content"])

            meta = {
                "content": str(chunk["content"]),
                "provider_id": str(chunk.get("provider_id", "")),
                "provider_name": str(chunk.get("provider_name", "")),
                "document_id": str(chunk.get("document_id", "")),
                "document_title": str(chunk.get("document_title", "")),
                "source_url": str(chunk.get("source_url", "")),
                "page_number": int(chunk.get("page_number") or 1),
                "section_title": str(chunk.get("section_title") or "General"),
                "effective_date": str(chunk.get("effective_date") or ""),
                "expiry_date": str(chunk.get("expiry_date") or ""),
                "verification_status": str(chunk.get("verification_status") or "verified"),
                "content_hash": str(chunk.get("content_hash", ""))
            }
            metadatas.append(meta)

        # 1. Dual-write to Pinecone if configured
        pinecone_idx = get_pinecone_index()
        if pinecone_idx is not None:
            try:
                vectors_to_upsert = []
                for i in range(len(ids)):
                    vectors_to_upsert.append({
                        "id": ids[i],
                        "values": embeddings[i],
                        "metadata": metadatas[i]
                    })

                # Batch upsert in chunks of 50
                batch_size = 50
                for b_start in range(0, len(vectors_to_upsert), batch_size):
                    batch = vectors_to_upsert[b_start:b_start + batch_size]
                    pinecone_idx.upsert(vectors=batch)
                logger.info(f"Upserted {len(vectors_to_upsert)} chunks to Pinecone index.")
            except Exception as e:
                logger.error(f"Error upserting vectors to Pinecone: {e}", exc_info=True)

        # 2. Dual-write to ChromaDB for resilience and instant fallback
        collection = get_collection()
        chroma_metas = [{k: v for k, v in m.items() if k != "content"} for m in metadatas]
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            metadatas=chroma_metas,
            documents=documents
        )

        return ids

    @staticmethod
    def delete_document(document_id: str):
        # Delete from Pinecone
        pinecone_idx = get_pinecone_index()
        if pinecone_idx is not None:
            try:
                pinecone_idx.delete(filter={"document_id": {"$eq": document_id}})
            except Exception as e:
                logger.error(f"Error deleting doc {document_id} from Pinecone: {e}")

        # Delete from ChromaDB
        collection = get_collection()
        try:
            collection.delete(where={"document_id": document_id})
        except Exception as e:
            logger.error(f"Error deleting doc {document_id} from Chroma: {e}")

    @staticmethod
    def search(
        query: str,
        provider_id: Optional[str] = None,
        top_k: int = 4,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query_embedding = embed_query(query)

        # Try Pinecone first if active
        if VectorStoreService.is_pinecone_active():
            pinecone_idx = get_pinecone_index()
            if pinecone_idx is not None:
                try:
                    pinecone_filter = {}
                    if provider_id and provider_id.strip() and provider_id != "general":
                        pinecone_filter["provider_id"] = {"$eq": provider_id.strip().lower()}
                    if status_filter:
                        pinecone_filter["verification_status"] = {"$eq": status_filter}

                    query_res = pinecone_idx.query(
                        vector=query_embedding,
                        top_k=top_k,
                        include_metadata=True,
                        filter=pinecone_filter if pinecone_filter else None
                    )

                    matched_items = []
                    matches = getattr(query_res, "matches", []) or []
                    for match in matches:
                        meta = getattr(match, "metadata", {}) or {}
                        score = float(getattr(match, "score", 0.0) or 0.0)
                        similarity = max(0.0, min(1.0, score))
                        content = meta.get("content", "")

                        matched_items.append({
                            "id": match.id,
                            "content": content,
                            "similarity": round(similarity, 4),
                            "distance": round(max(0.0, 1.0 - similarity), 4),
                            **meta
                        })

                    if matched_items:
                        matched_items.sort(key=lambda x: x["similarity"], reverse=True)
                        return matched_items
                except Exception as e:
                    logger.warning(f"Pinecone query encountered error, falling back to Chroma: {e}")

        # Fallback / Default: ChromaDB search
        collection = get_collection()
        where_clause = None
        conditions = []

        if provider_id and provider_id.strip() and provider_id != "general":
            conditions.append({"provider_id": provider_id.strip().lower()})

        if status_filter:
            conditions.append({"verification_status": status_filter})

        if len(conditions) == 1:
            where_clause = conditions[0]
        elif len(conditions) > 1:
            where_clause = {"$and": conditions}

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, max(1, collection.count())),
            where=where_clause,
            include=["documents", "metadatas", "distances"]
        )

        matched_items = []
        if results and results.get("ids") and len(results["ids"]) > 0:
            doc_ids = results["ids"][0]
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0]

            for i in range(len(doc_ids)):
                distance = distances[i] if distances is not None else 1.0
                similarity = max(0.0, min(1.0, 1.0 - (distance / 2.0)))

                matched_items.append({
                    "id": doc_ids[i],
                    "content": docs[i],
                    "similarity": round(similarity, 4),
                    "distance": round(distance, 4),
                    **metas[i]
                })

        matched_items.sort(key=lambda x: x["similarity"], reverse=True)
        return matched_items
