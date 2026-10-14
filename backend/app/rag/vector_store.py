import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.rag.embeddings import embed_texts, embed_query

_chroma_client = None
_collection = None
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


class VectorStoreService:
    @staticmethod
    def add_chunks(chunks: List[Dict[str, Any]]) -> List[str]:
        if not chunks:
            return []

        collection = get_collection()
        texts = [c["content"] for c in chunks]
        embeddings = embed_texts(texts)
        
        ids = []
        metadatas = []
        documents = []

        for idx, chunk in enumerate(chunks):
            chunk_id = f"{chunk['document_id']}_{chunk['chunk_index']}"
            ids.append(chunk_id)
            documents.append(chunk["content"])
            
            # Chroma metadata must only have str, int, float, bool
            meta = {
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

        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        return ids

    @staticmethod
    def delete_document(document_id: str):
        collection = get_collection()
        try:
            collection.delete(where={"document_id": document_id})
        except Exception:
            pass

    @staticmethod
    def search(
        query: str,
        provider_id: Optional[str] = None,
        top_k: int = 4,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        collection = get_collection()
        query_embedding = embed_query(query)

        # Construct Chroma `where` filter
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
                # Chroma cosine distance = 1 - cosine_similarity (range 0 to 2)
                distance = distances[i] if distances is not None else 1.0
                similarity = max(0.0, min(1.0, 1.0 - (distance / 2.0)))

                matched_items.append({
                    "id": doc_ids[i],
                    "content": docs[i],
                    "similarity": round(similarity, 4),
                    "distance": round(distance, 4),
                    **metas[i]
                })

        # Sort by similarity descending
        matched_items.sort(key=lambda x: x["similarity"], reverse=True)
        return matched_items
