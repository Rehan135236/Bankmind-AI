"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Upload,
  Plus,
  RefreshCw,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  FileCode,
  Layers
} from "lucide-react";
import { api, DocumentItem, Provider } from "../lib/api";

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);

  // Form states
  const [uploadProvider, setUploadProvider] = useState("easypaisa");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSourceUrl, setUploadSourceUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("verified");

  const [registerProvider, setRegisterProvider] = useState("easypaisa");
  const [registerTitle, setRegisterTitle] = useState("");
  const [registerSourceUrl, setRegisterSourceUrl] = useState("");
  const [registerText, setRegisterText] = useState("");
  const [registerStatus, setRegisterStatus] = useState("verified");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, provs] = await Promise.all([
        api.getDocuments(),
        api.getProviders()
      ]);
      setDocuments(docs);
      setProviders(provs);
    } catch (e) {
      console.error("Failed to load knowledge base", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getAdminToken = () => {
    return localStorage.getItem("bankmate_admin_token") || "demo-admin-token-jwt";
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setActionLoading(true);
    setActionMessage("Extracting text and chunking into vector store...");

    try {
      const formData = new FormData();
      formData.append("provider_id", uploadProvider);
      formData.append("title", uploadTitle);
      formData.append("source_url", uploadSourceUrl);
      formData.append("verification_status", uploadStatus);
      formData.append("file", uploadFile);

      await api.uploadDocument(formData, getAdminToken());
      setShowUploadModal(false);
      setUploadTitle("");
      setUploadSourceUrl("");
      setUploadFile(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setActionLoading(false);
      setActionMessage("");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage("Registering source and indexing chunks...");

    try {
      await api.registerSource(
        {
          provider_id: registerProvider,
          title: registerTitle,
          source_url: registerSourceUrl,
          verification_status: registerStatus,
          content_text: registerText
        },
        getAdminToken()
      );
      setShowRegisterModal(false);
      setRegisterTitle("");
      setRegisterSourceUrl("");
      setRegisterText("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Registration failed");
    } finally {
      setActionLoading(false);
      setActionMessage("");
    }
  };

  const handleReindex = async (docId: string) => {
    if (!confirm("Re-index document chunks in ChromaDB and PostgreSQL?")) return;
    try {
      await api.reindexDocument(docId, getAdminToken());
      await loadData();
    } catch (e: any) {
      alert(e.message || "Re-index failed");
    }
  };

  const handleStatusChange = async (docId: string, newStatus: string) => {
    try {
      await api.updateDocumentStatus(docId, newStatus, getAdminToken());
      await loadData();
    } catch (e: any) {
      alert(e.message || "Status change failed");
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete document and completely remove vector entries?")) return;
    try {
      await api.deleteDocument(docId, getAdminToken());
      await loadData();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const handleInspect = async (docId: string) => {
    try {
      const detail = await api.getDocumentDetail(docId);
      setInspectDoc(detail);
    } catch (e: any) {
      alert("Failed to load document details");
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.source_url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = filterProvider === "all" || d.provider_id === filterProvider;
    const matchesStatus = filterStatus === "all" || d.verification_status === filterStatus;
    return matchesSearch && matchesProvider && matchesStatus;
  });

  // Calculate Metrics
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const indexedDocs = documents.filter((d) => d.ingestion_status === "indexed").length;
  const historicalDocs = documents.filter((d) => d.verification_status === "historical").length;
  const unverifiedDocs = documents.filter((d) => d.verification_status === "unverified").length;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Database className="w-7 h-7 text-[#0D9488]" />
            <span>Official Knowledge Base Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authoritative source repository indexed for RAG vector search across Pakistani banking providers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Register Source URL</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-[#0D9488] hover:bg-[#0f766e] text-white rounded-xl shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Documents</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{documents.length}</span>
          <span className="text-[10px] text-slate-400">All registered policies</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Indexed Chunks</span>
          <span className="text-2xl font-black text-[#0D9488] mt-1 block">{totalChunks}</span>
          <span className="text-[10px] text-slate-400">ChromaDB vectors</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Active Verified</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {documents.length - historicalDocs - unverifiedDocs}
          </span>
          <span className="text-[10px] text-slate-400">Live authoritative</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Historical Archives</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{historicalDocs}</span>
          <span className="text-[10px] text-slate-400">Expired reference</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Pending Verification</span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">{unverifiedDocs}</span>
          <span className="text-[10px] text-slate-400">Awaiting validation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Primary Database</span>
          <span className="text-lg font-black text-blue-600 mt-1.5 block">Neon Cloud</span>
          <span className="text-[10px] text-slate-400">PostgreSQL 18.6 Live</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title or URL..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Provider:</span>
          </div>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-1.5 text-xs text-slate-600 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="historical">Historical</option>
            <option value="unverified">Unverified</option>
          </select>

          <button
            onClick={loadData}
            className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ml-auto"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Document Title & Source</th>
                <th className="py-3.5 px-4">Effective Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Chunks</th>
                <th className="py-3.5 px-4">Hash</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching banking documents found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 uppercase tracking-tight">
                        {doc.provider_id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 max-w-sm truncate">
                          {doc.title}
                        </div>
                        <a
                          href={doc.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#0D9488] hover:underline flex items-center gap-1 mt-0.5 truncate max-w-xs"
                        >
                          <span className="truncate">{doc.source_url}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {doc.effective_date || "Current"}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={doc.verification_status}
                          onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border focus:outline-none ${
                            doc.verification_status === "verified"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : doc.verification_status === "historical"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          <option value="verified">Verified</option>
                          <option value="historical">Historical</option>
                          <option value="unverified">Unverified</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {doc.chunk_count}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                        {doc.content_hash.slice(0, 10)}...
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleInspect(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-[#0D9488] hover:bg-teal-50 rounded-lg transition-colors"
                            title="Inspect Text & Chunks"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleReindex(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Re-index Vector Embeddings"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Document Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#0D9488]" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{inspectDoc.title}</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Provider: {inspectDoc.provider_id.toUpperCase()} • Chunks: {inspectDoc.chunk_count}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              {/* Preview */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Extracted Content Preview:
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {inspectDoc.extracted_text_preview || "No preview text recorded."}
                </div>
              </div>

              {/* Chunks */}
              {inspectDoc.chunks && inspectDoc.chunks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Indexed Semantic Chunks ({inspectDoc.chunks.length}):
                  </h4>
                  <div className="space-y-2">
                    {inspectDoc.chunks.map((c, i) => (
                      <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
                        <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold mb-1 pb-1 border-b border-slate-100">
                          <span>Chunk #{c.chunk_index + 1} — Section: {c.section_title || "General"}</span>
                          <span>Page {c.page_number || 1} • Chroma ID: {c.chroma_id}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-sans">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#0D9488]" />
              <span>Upload Official Banking Document</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Accepted formats: PDF, TXT, Markdown, HTML. Scanned PDFs without readable text will be flagged for OCR.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Institution</label>
                <select
                  value={uploadProvider}
                  onChange={(e) => setUploadProvider(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Meezan Bank Schedule of Charges (Jul-Dec 2026)"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Source URL</label>
                <input
                  type="url"
                  value={uploadSourceUrl}
                  onChange={(e) => setUploadSourceUrl(e.target.value)}
                  placeholder="https://www.meezanbank.com/downloads/soc.pdf"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.html"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0f766e] rounded-lg shadow-sm"
                >
                  {actionLoading ? "Processing Ingestion..." : "Upload & Ingest Chunks"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Source Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#0D9488]" />
              <span>Register Official Source URL</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add verified policy text directly from an official bank page.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provider</label>
                <select
                  value={registerProvider}
                  onChange={(e) => setRegisterProvider(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Title</label>
                <input
                  type="text"
                  value={registerTitle}
                  onChange={(e) => setRegisterTitle(e.target.value)}
                  placeholder="e.g. SBP Circular on Free Raast Transfers"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source URL</label>
                <input
                  type="url"
                  value={registerSourceUrl}
                  onChange={(e) => setRegisterSourceUrl(e.target.value)}
                  placeholder="https://www.sbp.org.pk/circulars/..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Content / Policy Text</label>
                <textarea
                  rows={5}
                  value={registerText}
                  onChange={(e) => setRegisterText(e.target.value)}
                  placeholder="Paste official policy text or circular excerpts here..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none font-mono"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0f766e] rounded-lg shadow-sm"
                >
                  {actionLoading ? "Registering..." : "Index Source"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
