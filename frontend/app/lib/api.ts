export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "127.0.0.1";
    return `http://${hostname}:8000/api`;
  }
  return "http://127.0.0.1:8000/api";
}

export interface Provider {
  id: string;
  name: string;
  provider_type: string;
  website_url: string;
  description: string;
  helpline: string;
  official_channels?: Record<string, string>;
  is_active: boolean;
  document_count: number;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  page_number?: number;
  section_title?: string;
  content: string;
  content_hash: string;
  chroma_id: string;
}

export interface DocumentItem {
  id: string;
  provider_id: string;
  title: string;
  source_url: string;
  document_type: string;
  publication_date?: string;
  effective_date?: string;
  expiry_date?: string;
  retrieval_date: string;
  language: string;
  verification_status: "verified" | "unverified" | "historical";
  content_hash: string;
  is_scanned_ocr_required: boolean;
  chunk_count: number;
  ingestion_status: string;
  last_indexed_at?: string;
  extracted_text_preview?: string;
  chunks?: DocumentChunk[];
}

export interface Citation {
  provider_id: string;
  provider_name: string;
  document_id: string;
  document_title: string;
  source_url: string;
  page_number?: number;
  section_title?: string;
  excerpt: string;
  similarity_score: number;
  verification_status: string;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
  citations: Citation[];
  retrieval_mode: string;
  provider_id?: string;
  latency_ms: number;
  abstention: boolean;
  warning?: string;
}

export interface AnalyticsOverview {
  total_questions: number;
  questions_by_provider: Array<{
    provider_id: string;
    name: string;
    question_count: number;
    document_count: number;
  }>;
  top_topics: Array<{
    topic: string;
    count: number;
  }>;
  retrieval_success_rate: number;
  unsupported_abstention_rate: number;
  citation_coverage: number;
  positive_feedback_rate: number;
  average_latency_ms: number;
  is_synthetic_notice: string;
}

export const api = {
  async getProviders(): Promise<Provider[]> {
    const base = getApiBase();
    try {
      const res = await fetch(`${base}/providers`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch providers");
      return await res.json();
    } catch (err) {
      const altBase = base.includes("localhost") ? "http://127.0.0.1:8000/api" : "http://localhost:8000/api";
      const altRes = await fetch(`${altBase}/providers`, { cache: "no-store" });
      if (!altRes.ok) throw err;
      return await altRes.json();
    }
  },

  async getDocuments(providerId?: string, status?: string): Promise<DocumentItem[]> {
    const params = new URLSearchParams();
    if (providerId && providerId !== "general") params.append("provider_id", providerId);
    if (status) params.append("verification_status", status);
    const base = getApiBase();
    try {
      const res = await fetch(`${base}/sources?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return await res.json();
    } catch (err) {
      const altBase = base.includes("localhost") ? "http://127.0.0.1:8000/api" : "http://localhost:8000/api";
      const altRes = await fetch(`${altBase}/sources?${params.toString()}`, { cache: "no-store" });
      if (!altRes.ok) throw err;
      return await altRes.json();
    }
  },

  async getDocumentDetail(documentId: string): Promise<DocumentItem> {
    const base = getApiBase();
    try {
      const res = await fetch(`${base}/sources/${documentId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch document details");
      return await res.json();
    } catch (err) {
      const altBase = base.includes("localhost") ? "http://127.0.0.1:8000/api" : "http://localhost:8000/api";
      const altRes = await fetch(`${altBase}/sources/${documentId}`, { cache: "no-store" });
      if (!altRes.ok) throw err;
      return await altRes.json();
    }
  },

  async sendChatMessage(payload: {
    message: string;
    provider_id?: string | null;
    conversation_id?: string | null;
    top_k?: number;
  }): Promise<ChatResponse> {
    const base = getApiBase();
    const bodyStr = JSON.stringify(payload);
    try {
      const res = await fetch(`${base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Chat request failed" }));
        throw new Error(err.detail || "Chat service error");
      }
      return await res.json();
    } catch (err) {
      const altBase = base.includes("localhost") ? "http://127.0.0.1:8000/api" : "http://localhost:8000/api";
      const altRes = await fetch(`${altBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr
      });
      if (!altRes.ok) throw err;
      return await altRes.json();
    }
  },

  async submitFeedback(messageId: string, isHelpful: boolean, comment?: string) {
    const res = await fetch(`${getApiBase()}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, is_helpful: isHelpful, comment })
    });
    return res.json();
  },

  async getAnalytics(): Promise<AnalyticsOverview> {
    const res = await fetch(`${getApiBase()}/analytics/overview`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  },

  async login(email: string, password: string): Promise<{ access_token: string; role: string }> {
    const res = await fetch(`${getApiBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error("Invalid admin credentials");
    return res.json();
  },

  async registerSource(payload: any, token: string) {
    const res = await fetch(`${getApiBase()}/sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to register source" }));
      throw new Error(err.detail || "Error registering source");
    }
    return res.json();
  },

  async uploadDocument(formData: FormData, token: string) {
    const res = await fetch(`${getApiBase()}/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload error");
    }
    return res.json();
  },

  async reindexDocument(documentId: string, token: string) {
    const res = await fetch(`${getApiBase()}/documents/${documentId}/reindex`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Re-index failed");
    return res.json();
  },

  async updateDocumentStatus(documentId: string, status: string, token: string) {
    const res = await fetch(`${getApiBase()}/documents/${documentId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ verification_status: status })
    });
    if (!res.ok) throw new Error("Status update failed");
    return res.json();
  },

  async deleteDocument(documentId: string, token: string) {
    const res = await fetch(`${getApiBase()}/documents/${documentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
  }
};
