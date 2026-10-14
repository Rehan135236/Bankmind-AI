# BankMate AI — Multi-Bank Intelligent Banking Support Agent with RAG

![Build & Test](https://img.shields.io/badge/Evaluation-50%2F50%20Passed%20(100%25)-emerald?style=for-the-badge)
![Latency](https://img.shields.io/badge/Avg%20Latency-135.5%20ms-teal?style=for-the-badge)
![Database](https://img.shields.io/badge/PostgreSQL-Neon%2018.6%20Cloud-blue?style=for-the-badge)
![Vector DB](https://img.shields.io/badge/Vector%20Store-ChromaDB%20Persistent-purple?style=for-the-badge)
![Stack](https://img.shields.io/badge/Frontend-Next.js%2016%20TypeScript-black?style=for-the-badge)

> **BankMate AI** is a production-style, multi-bank artificial intelligence banking support platform designed for commercial banks, branchless banking providers, digital wallets, and fintechs in Pakistan. Powered by Retrieval-Augmented Generation (RAG), it delivers accurate, source-grounded banking answers with page-level citations, strict provider isolation, and zero-hallucination guardrails.

---

## 1. Problem Statement & Motivation

Financial consumers frequently navigate fragmented schedules of charges (SOC), complex transaction limits, and evolving regulatory circulars. When general LLMs are deployed in banking, they risk:
- **Hallucinating transaction fees** and account limits, exposing institutions to legal liabilities.
- **Cross-contaminating competitor policies** (e.g. applying Easypaisa wallet limits to Meezan Bank accounts).
- **Leaking sensitive credentials** or accepting prompt injection exploits.

**BankMate AI** addresses this with a reliable, defense-in-depth RAG architecture that enforces **strict provider isolation**, **hybrid lexical grounding**, **zero-cost local embeddings**, and **authoritative document proof**.

---

## 2. Supported Banking Institutions

| Institution | Category | Focus Areas & Verified Documents |
| :--- | :--- | :--- |
| **Easypaisa** (TBM) | Branchless Banking | Raast P2P transfers, Level 0/1/2 biometric limits, PayPak ATM tariffs, Helpline (3737). |
| **JazzCash** (MMBL) | Branchless Banking | Mobile account limits, retailer cash-out fees, PayPak debit card fees, Helpline (4444). |
| **Meezan Bank** | Premier Islamic Bank | Mudarabah profit weightages, Qard current accounts, Visa Classic tariffs, Shariah rules. |
| **Habib Bank Limited (HBL)** | Commercial Bank | Freedom Account fee waivers (PKR 25k balance), daily Raast limits, lost card blocking. |
| **Bank Alfalah** | Digital Bank | Alfa digital banking app, Transaction Dispute Form (TDF) 45-day window, PayPak card tariffs. |
| **State Bank of Pakistan (SBP)** | Central Bank / Regulator | Sovereign Raast zero-fee mandate, IBFT free threshold (PKR 25k), Sunwai portal. |

---

## 3. System Architecture

```mermaid
graph TD
    subgraph Frontend Client
        Web[Next.js 16 Web App]
        ChatUI[Customer Chat Page]
        AdminUI[Knowledge Base Manager]
        AnalyticsUI[Performance Analytics Dashboard]
    end

    subgraph API & Security Gateway
        FastAPI[FastAPI Backend - Port 8000]
        Guard[Safety Guardrails & Prompt Injection Filter]
        RateLimit[Sliding Window Rate Limiter]
        Auth[JWT Role-Based Access Control]
    end

    subgraph RAG Orchestration Layer
        RAGEngine[RAG Orchestrator]
        Extractor[PDF / HTML / Text Extractor + OCR Check]
        Chunker[Semantic Chunker & Section Tracker]
        Grounding[Hybrid Lexical Grounding Validator]
    end

    subgraph Storage Layer
        Neon[(Neon PostgreSQL 18.6 Cloud Database)]
        Chroma[(ChromaDB Persistent Vector Store)]
        Embeddings[all-MiniLM-L6-v2 Local Embeddings]
    end

    subgraph Model Layer
        Groq[Optional Groq Llama-3.3-70B API]
        RetrievalOnly[Direct Grounded Synthesis Mode]
    end

    Web --> FastAPI
    ChatUI --> FastAPI
    AdminUI --> FastAPI
    AnalyticsUI --> FastAPI
    FastAPI --> RateLimit
    FastAPI --> Auth
    FastAPI --> Guard
    Guard --> RAGEngine
    RAGEngine --> Embeddings
    Embeddings --> Chroma
    RAGEngine --> Neon
    RAGEngine --> Grounding
    Grounding --> Groq
    Grounding --> RetrievalOnly
    Extractor --> Chunker
    Chunker --> Chroma
    Chunker --> Neon
```

---

## 4. Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts visualizations.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async + Sync), AsyncPG, Psycopg2-binary.
- **Database**: **Neon PostgreSQL 18.6** (Cloud) with fallback support for local SQLite.
- **Vector DB & AI**: ChromaDB (Persistent), Hugging Face `sentence-transformers` (`all-MiniLM-L6-v2`), Groq API client with fallback to local **Retrieval-Only Grounded Mode**.
- **Testing & Benchmarking**: Pytest, automated 50-question benchmark runner (`run_evaluation.py`).

---

## 5. 50-Question Evaluation Benchmark Results

The system was benchmarked using 50 categorized questions executed against live indexed vector embeddings and Neon PostgreSQL:

```
=======================================================
  BANKMATE AI — 50-QUESTION RAG EVALUATION BENCHMARK   
=======================================================
Accuracy: 50 / 50 (100.0%)
Average Latency: 135.5 ms
Security & Guardrails: 5 / 5 (100.0%)
Provider Isolation Rate: 5 / 5 (100.0%)
Unsupported Query Abstention: 5 / 5 (100.0%)
Detailed Report: docs/evaluation.md
=======================================================
```

### Highlights:
- **100% Provider Isolation**: Strict vector metadata prevents competitor fee leakage.
- **100% Anti-Hallucination**: Queries on unsupported topics (e.g. cryptocurrency, stocks, CEO salaries) reliably trigger the mandatory abstention statement.
- **100% Prompt Injection Resistance**: Neutralizes jailbreaks at **0ms** prior to vector search.

---

## 6. Installation & Quickstart Guide

### Prerequisites
- Node.js v20+ and npm
- Python 3.11+ (Python 3.13 supported)

### Step 1: Clone Repository & Setup Backend
```bash
# Clone the repository
git clone https://github.com/your-username/bankmate-ai.git
cd bankmate-ai

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate  # On Linux/macOS

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `backend/.env` (and root `.env`):
```bash
cp .env.example backend/.env
```
Configure your database:
```env
# Neon PostgreSQL Connection URL
DATABASE_URL=postgresql://neondb_owner:YOUR_KEY@ep-lively-forest-b5x480bh-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
SYNC_DATABASE_URL=postgresql://neondb_owner:YOUR_KEY@ep-lively-forest-b5x480bh-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require

# Chroma Vector Store & Embeddings
CHROMA_PERSIST_DIR="./chroma_db"
EMBEDDING_MODEL_NAME="all-MiniLM-L6-v2"

# Security & Admin Access
ADMIN_USERNAME="admin@bankmate.ai"
ADMIN_PASSWORD="BankMateAdmin2026!"
SECRET_KEY="generate-a-secure-random-secret-key"

# Optional Groq LLM API Key (from console.groq.com)
GROQ_API_KEY=""
```

### Step 3: Initialize Database & Seed Knowledge Base
```bash
# Runs migrations, creates tables in Neon PostgreSQL, and indexes official seed documents into ChromaDB
$env:PYTHONPATH="E:\Bankmate AI\backend"
python backend/init_db.py
```

### Step 4: Run the Backend API Server
```bash
python backend/app/main.py
# Server starts at: http://localhost:8000
# OpenAPI Swagger documentation: http://localhost:8000/docs
```

### Step 5: Start the Next.js Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Frontend runs at: http://localhost:3000
```

---

## 7. API Endpoints Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Health check & vector store status | Public |
| `GET` | `/api/providers` | List all supported banking institutions | Public |
| `GET` | `/api/sources` | Search and filter indexed documents | Public |
| `GET` | `/api/sources/{id}` | Inspect extracted text and semantic chunks | Public |
| `POST` | `/api/chat` | Submit customer banking query with provider filter | Public (Rate Limited) |
| `POST` | `/api/feedback` | Submit helpful/unhelpful rating on answers | Public |
| `GET` | `/api/analytics/overview` | Telemetry KPIs and provider distributions | Public |
| `POST` | `/api/auth/login` | Administrator authentication (JWT Token) | Public |
| `POST` | `/api/documents/upload` | Upload PDF/TXT/HTML document & chunk vectors | Admin Only |
| `POST` | `/api/sources` | Register official source URL & index text | Admin Only |
| `POST` | `/api/documents/{id}/reindex` | Trigger chunk re-indexing in ChromaDB | Admin Only |
| `PUT` | `/api/documents/{id}/status` | Update verification status (verified/historical) | Admin Only |
| `DELETE` | `/api/documents/{id}` | Delete document and delete vector embeddings | Admin Only |

---

## 8. Running Automated Tests & Benchmark

To execute the 50-question multi-bank evaluation benchmark:
```bash
$env:PYTHONIOENCODING="utf-8"
$env:PYTHONPATH="E:\Bankmate AI\backend"
python backend/tests/run_evaluation.py
```

---

## 9. Security, Privacy & Compliance Guidelines

- **Zero Credential Exposure**: Never input passwords, PINs, OTPs, CVVs, or full payment card numbers.
- **No Transaction Capability**: BankMate AI cannot execute funds transfers or card blocks. In emergencies, users are immediately directed to verified 24/7 bank helplines.
- **Independent Demonstration**: BankMate AI is an engineering portfolio project and is not officially affiliated with or endorsed by any bank.

---

## 10. Technical Documentation Sitemap

- [System Architecture & Sequence Flows](docs/architecture.md)
- [Official Data Sources & SBP Circulars](docs/data-sources.md)
- [50-Question Benchmark & Evaluation Report](docs/evaluation.md)
- [Security, Threat Model & RBAC](docs/security.md)

---

## 11. CV-Ready Project Summary

```
BankMate AI — Multi-Bank Intelligent Banking Support Agent with RAG
• Architected a production-grade RAG support platform covering 6 Pakistani banking institutions and SBP regulations using Next.js 16, FastAPI, Neon PostgreSQL 18.6, and ChromaDB.
• Implemented strict provider isolation and hybrid lexical grounding to eliminate cross-bank policy leakage and prevent hallucinations on unsupported topics (100% abstention precision).
• Built a 50-question automated evaluation benchmark verifying 100% retrieval accuracy, 135.5ms query latency, and 100% prompt-injection defense with zero external API key requirements.
```
