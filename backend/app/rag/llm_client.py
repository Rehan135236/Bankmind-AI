import os
from typing import List, Dict, Any, Optional
from groq import Groq
from app.core.config import settings
from app.rag.guardrails import ABSTENTION_MESSAGE

SYSTEM_PROMPT = """You are BankMate AI, an intelligent banking support assistant for Pakistan's banking sector.
Your mission is to provide accurate, source-grounded answers based strictly on official Pakistani banking documents.

MANDATORY RULES:
1. Answer ONLY from the provided retrieved context. NEVER use external or unverified assumptions for policy-specific questions.
2. NEVER fabricate account fees, transfer limits, profit rates, eligibility rules, complaint timelines, or contact numbers.
3. If the retrieved context does not contain sufficient factual evidence to answer the question, you MUST reply with:
   "{abstention_message}"
4. Every specific claim, fee, or limit must be cited with the source title and page number (e.g. "[Source: Raast FAQ, Page 2]").
5. If a document is tagged as "historical" or "unverified", explicitly warn the user that the information may not reflect current policy.
6. Never request passwords, PINs, OTPs, CVVs, or payment card numbers.
7. Never claim to have blocked a card, transferred money, or modified bank accounts.
8. Distinguish between branchless banking providers (e.g. Easypaisa, JazzCash), commercial banks (HBL, Alfalah), Islamic banks (Meezan), and the regulator (SBP).
"""

def generate_answer_with_groq(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    provider_name: str
) -> str:
    if not settings.GROQ_API_KEY:
        return ""

    client = Groq(api_key=settings.GROQ_API_KEY)

    # Format context
    context_str = ""
    for idx, chunk in enumerate(retrieved_chunks):
        status_note = ""
        if chunk.get("verification_status") == "historical":
            status_note = " [WARNING: HISTORICAL DOCUMENT - MAY BE OUTDATED]"
        elif chunk.get("verification_status") == "unverified":
            status_note = " [WARNING: UNVERIFIED DOCUMENT]"

        context_str += (
            f"\n--- DOCUMENT CHUNK {idx+1} ---{status_note}\n"
            f"Provider: {chunk.get('provider_name')}\n"
            f"Document Title: {chunk.get('document_title')}\n"
            f"Page Number: {chunk.get('page_number')}\n"
            f"Section: {chunk.get('section_title')}\n"
            f"Content:\n{chunk.get('content')}\n"
        )

    user_prompt = f"""Target Provider: {provider_name}
User Question: {query}

Retrieved Official Evidence:
{context_str}

Please provide an accurate, source-grounded answer based strictly on the retrieved evidence above."""

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.format(abstention_message=ABSTENTION_MESSAGE)},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=800
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Fall back to retrieval-only mode if Groq call fails (e.g. invalid key or rate limit)
        return ""


def generate_retrieval_only_answer(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    provider_name: str
) -> str:
    """
    Retrieval-Only Grounded Mode:
    Synthesizes verbatim verified passages into a structured answer without requiring an external LLM API key.
    """
    if not retrieved_chunks:
        return ABSTENTION_MESSAGE

    top_chunk = retrieved_chunks[0]
    
    # Check if top chunk has high relevance
    if top_chunk.get("similarity", 0.0) < settings.SIMILARITY_THRESHOLD:
        return ABSTENTION_MESSAGE

    answer_parts = []
    
    # Check if top chunk or primary evidence is historical
    if top_chunk.get("verification_status") == "historical":
        answer_parts.append(
            "> ⚠️ **Historical Policy Notice**: The most relevant document retrieved for this inquiry is from a historical archive (expired/deprecated policy) and may not represent active rules.\n"
        )

    answer_parts.append(
        f"**Official Grounded Excerpts for {provider_name}:**\n"
    )

    for idx, chunk in enumerate(retrieved_chunks[:3]):
        doc_title = chunk.get("document_title", "Official Policy")
        page = chunk.get("page_number", 1)
        section = chunk.get("section_title", "General")
        content = chunk.get("content", "").strip()
        status_tag = ""
        if chunk.get("verification_status") == "historical":
            status_tag = " `[HISTORICAL ARCHIVE]`"
        elif chunk.get("verification_status") == "unverified":
            status_tag = " `[AWAITING VERIFICATION]`"

        answer_parts.append(
            f"### {idx+1}. {section}{status_tag} *(Source: {doc_title}, Page {page})*\n"
            f"{content}\n"
        )

    answer_parts.append(
        "\n*Note: Running in BankMate Grounded Retrieval Mode (Direct Official Citation). "
        "For complete terms or account assistance, please refer to the cited documents or official bank channels.*"
    )

    return "\n".join(answer_parts)
