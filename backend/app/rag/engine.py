import time
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.rag.guardrails import SafetyGuardrails, ABSTENTION_MESSAGE
from app.rag.vector_store import VectorStoreService
from app.rag.llm_client import generate_answer_with_groq, generate_retrieval_only_answer


class RAGEngine:
    @staticmethod
    def answer_query(
        query: str,
        provider_id: Optional[str] = None,
        provider_name: Optional[str] = None,
        top_k: int = 4
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Guardrail safety check
        is_safe, rejection = SafetyGuardrails.inspect_query(query)
        if not is_safe:
            latency = int((time.time() - start_time) * 1000)
            return {
                "answer": rejection,
                "citations": [],
                "retrieval_mode": "guardrail_rejected",
                "latency_ms": latency,
                "abstention": True,
                "warning": None
            }

        # 2. Provider alignment warning
        alignment_warning = SafetyGuardrails.check_provider_alignment(query, provider_id)

        # Provider display name
        display_provider = provider_name or (provider_id.title() if provider_id and provider_id != "general" else "Pakistan Banking Sector")

        # 3. Retrieve relevant chunks
        retrieved_chunks = VectorStoreService.search(
            query=query,
            provider_id=provider_id if provider_id != "general" else None,
            top_k=top_k
        )

        # 4. Check if we have relevant chunks exceeding similarity threshold
        relevant_chunks = [
            c for c in retrieved_chunks if c.get("similarity", 0.0) >= settings.SIMILARITY_THRESHOLD
        ]

        # Check hybrid lexical grounding for specific content keywords
        is_grounded = True
        if relevant_chunks:
            # Extract salient topic words
            stopwords = {
                "what", "where", "which", "when", "whom", "whose", "why", "how", "does", "doesnt",
                "will", "would", "shall", "should", "could", "about", "their", "there", "these",
                "those", "with", "from", "into", "onto", "under", "above", "below", "between",
                "bank", "banking", "account", "customer", "customers", "official", "policy", "terms",
                "help", "service", "services", "guide", "rules", "using", "user", "users", "please",
                "tell", "know", "find", "have", "been", "were", "some", "more", "most", "than",
                "then", "also", "each", "both", "either", "neither", "only", "same", "such",
                "provider", "system", "online", "mobile", "digital", "pakistan", "pakistani",
                "easypaisa", "jazzcash", "meezan", "hbl", "alfalah", "alfa", "sbp", "telenor", "mobilink",
                "branch", "branches", "zero", "today", "price", "direct", "directly", "main", "exact"
            }
            words = [w.strip() for w in query.lower().split() if len(w.strip()) >= 4]
            salient_terms = [w for w in words if w not in stopwords and w.isalpha()]
            
            combined_context = " ".join(c.get("content", "").lower() for c in relevant_chunks)
            if len(salient_terms) >= 2:
                # If query contains multiple specific topics, require at least 2 terms to match
                matches = [term for term in salient_terms if term in combined_context]
                if len(matches) < min(2, len(salient_terms)):
                    is_grounded = False

        # 5. Abstention if no chunks pass threshold or evidence lacks topic grounding
        if not relevant_chunks or not is_grounded:
            latency = int((time.time() - start_time) * 1000)
            return {
                "answer": ABSTENTION_MESSAGE,
                "citations": [],
                "retrieval_mode": "abstention",
                "latency_ms": latency,
                "abstention": True,
                "warning": alignment_warning
            }

        # 6. Format citations
        citations = []
        for chunk in relevant_chunks:
            citations.append({
                "provider_id": chunk.get("provider_id", ""),
                "provider_name": chunk.get("provider_name", ""),
                "document_id": chunk.get("document_id", ""),
                "document_title": chunk.get("document_title", ""),
                "source_url": chunk.get("source_url", ""),
                "page_number": chunk.get("page_number", 1),
                "section_title": chunk.get("section_title", "General"),
                "excerpt": chunk.get("content", "")[:350] + "...",
                "similarity_score": chunk.get("similarity", 0.0),
                "verification_status": chunk.get("verification_status", "verified")
            })

        # 7. Generate answer
        retrieval_mode = "retrieval_only"
        answer = ""
        
        if settings.GROQ_API_KEY:
            answer = generate_answer_with_groq(query, relevant_chunks, display_provider)
            if answer:
                retrieval_mode = "llm_groq"

        if not answer:
            answer = generate_retrieval_only_answer(query, relevant_chunks, display_provider)
            retrieval_mode = "retrieval_only"

        # If LLM triggered abstention
        is_abstention = (ABSTENTION_MESSAGE in answer)

        latency = int((time.time() - start_time) * 1000)
        return {
            "answer": answer,
            "citations": citations,
            "retrieval_mode": retrieval_mode,
            "latency_ms": latency,
            "abstention": is_abstention,
            "warning": alignment_warning
        }
