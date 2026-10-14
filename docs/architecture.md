# BankMate AI — System Architecture & Workflow Specifications

## 1. High-Level Architecture Overview

BankMate AI is designed as a decoupled, multi-bank intelligent retrieval-augmented generation (RAG) platform tailored for Pakistani banking institutions and State Bank of Pakistan (SBP) regulatory standards.

```mermaid
graph TD
    subgraph Client Layer
        Web[Next.js 16 Web App]
        Mobile[Responsive Viewport]
    end

    subgraph API & Guardrails Gateway
        FastAPI[FastAPI Backend - Port 8000]
        Guard[Safety Guardrails & Injection Defense]
        Auth[JWT Authentication & Rate Limiting]
    end

    subgraph RAG Orchestration Layer
        RAGEngine[RAG Query Engine]
        Chunker[Semantic Chunker & Section Tracker]
        Extractor[PDF / HTML / TXT Extractor with OCR Check]
        Hybrid[Hybrid Grounding Validator]
    end

    subgraph Vector & Knowledge Storage
        Chroma[ChromaDB Persistent Vector Store]
        Embeddings[all-MiniLM-L6-v2 Embeddings]
    end

    subgraph Relational Persistence
        Neon[(Neon PostgreSQL 18.6 Cloud Database)]
    end

    subgraph Model Layer
        LLM[Groq Llama-3.3-70B API]
        DirectRetriever[Grounded Retrieval-Only Mode]
    end

    Web -->|REST / JSON| FastAPI
    Mobile -->|REST / JSON| FastAPI
    FastAPI --> Auth
    FastAPI --> Guard
    Guard --> RAGEngine
    RAGEngine --> Embeddings
    Embeddings --> Chroma
    RAGEngine --> Neon
    RAGEngine --> Hybrid
    Hybrid --> LLM
    Hybrid --> DirectRetriever
    Extractor --> Chunker
    Chunker --> Chroma
    Chunker --> Neon
```

---

## 2. Ingestion Pipeline Sequence

The document ingestion pipeline processes public regulatory and bank documents, calculating content hashes, chunking with section awareness, generating local embeddings, and indexing them into ChromaDB and Neon PostgreSQL.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Bank Compliance Admin
    participant API as FastAPI /api/documents/upload
    participant Ext as DocumentExtractor
    participant Chk as SemanticChunker
    participant Emb as Local Sentence-Transformer
    participant Chroma as ChromaDB Vector DB
    participant DB as Neon PostgreSQL

    Admin->>API: Upload Document (PDF/MD/HTML) + Metadata
    API->>API: Validate Magic Bytes, File Size (Max 15MB), Extension
    API->>Ext: Extract Page Text & Run OCR Density Check
    Ext-->>API: Pages Data + OCR Flag (True/False)
    API->>Chk: Chunk Text (700 chars, 120 overlap, Section Detection)
    Chk-->>API: List of Chunks with Section & Page Metadatas
    API->>Emb: Generate Normalized Embeddings (all-MiniLM-L6-v2)
    Emb-->>API: Float Vectors (384-dimensional)
    API->>Chroma: Upsert Vectors + Provider Isolated Metadata
    API->>DB: Store Document & DocumentChunk Records
    API->>DB: Record IngestionJob & AuditLog
    API-->>Admin: Return Ingestion Report (Chunks Count, Duration, Status)
```

---

## 3. RAG Query & Strict Provider Isolation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Bank Customer
    participant UI as Chat UI (Next.js)
    participant API as FastAPI /api/chat
    participant Guard as SafetyGuardrails
    participant Vec as VectorStoreService
    participant RAG as RAGEngine
    participant DB as Neon PostgreSQL

    Customer->>UI: Select Provider (e.g. Meezan Bank) & Ask Question
    UI->>API: POST /api/chat (Query, Provider ID, Top_K)
    API->>Guard: Validate Prompt Injection, OTP/PIN Leaks, Action Requests
    alt Guardrail Violated
        Guard-->>API: Return Safe Rejection / Security Advisory
        API-->>UI: Display Alert without Executing Vector Search
    else Query Safe
        Guard->>Guard: Check Cross-Bank Alignment (e.g. Asking JazzCash on Meezan)
        API->>Vec: Search ChromaDB with Metadata Filter {provider_id: "meezan"}
        Vec-->>API: Top K Chunks with Cosine Distance & Page Metadata
        API->>RAG: Verify Lexical Topic Grounding & Similarity Threshold (>= 0.35)
        alt Unsupported Query (No Grounding Match)
            RAG-->>API: Return Mandatory Abstention Response
        else Factual Evidence Found
            RAG->>RAG: Format Verified Citations (Doc Title, Page, URL)
            RAG->>RAG: Generate Source-Grounded Synthesized Answer
        end
        API->>DB: Record Conversation, User Query, Assistant Response, Latency
        API-->>UI: Return Structured Response with Expandable Citations
        UI-->>Customer: Render Answer with Page Citations & Feedback Actions
    end
```

---

## 4. Key Design Decisions

1. **Provider Isolation**:
   Every chunk in ChromaDB is indexed with strict metadata `provider_id`. Queries targeting a specific bank execute filtered vector search, preventing fees or rules from leaking between financial competitors.
2. **Mandatory Abstention Policy**:
   If a question concerns topics unsupported by the official evidence (e.g. cryptocurrency, stocks, CEO salaries), the system triggers explicit abstention:
   > *"I couldn't verify this information in the available official documents. Please consult the provider's official website or verified support channel."*
3. **Dual Execution Mode**:
   - **Mode A (Grounded Retrieval-Only)**: Zero API key dependency. Verbatim extracts with page proof.
   - **Mode B (Groq Generative Mode)**: Configurable when `GROQ_API_KEY` is provided.
4. **Neon PostgreSQL Cloud Storage**:
   Persistent cloud database storing conversation histories, message logs, document metadata, audit logs, and analytics.
