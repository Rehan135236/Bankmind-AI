"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Layers,
  Lock,
  LogOut,
  ArrowLeft,
  KeyRound,
  ShieldAlert
} from "lucide-react";
import { api, DocumentItem, Provider } from "../lib/api";

export default function KnowledgeBasePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState("admin@bankmate.ai");
  const [loginPassword, setLoginPassword] = useState("BankMateAdmin2026!");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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
      setDocuments(docs || []);
      setProviders(provs || []);
    } catch (e) {
      console.error("Failed to load knowledge base", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bankmate_admin_token") : null;
    if (token) {
      setIsAuthenticated(true);
      loadData();
    }
    setAuthChecking(false);
  }, []);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await api.login(loginEmail, loginPassword);
      if (res && res.access_token) {
        localStorage.setItem("bankmate_admin_token", res.access_token);
        setIsAuthenticated(true);
        loadData();
      } else {
        throw new Error("Invalid response");
      }
    } catch (err: any) {
      // Local fallback for demo credentials
      if (loginEmail === "admin@bankmate.ai" && loginPassword === "BankMateAdmin2026!") {
        localStorage.setItem("bankmate_admin_token", "demo-admin-token-jwt");
        setIsAuthenticated(true);
        loadData();
      } else {
        setLoginError("Invalid staff credentials. Access is restricted to authorized personnel.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bankmate_admin_token");
    setIsAuthenticated(false);
  };

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
    setActionMessage("Registering policy and building semantic index...");

    try {
      await api.registerSource(
        {
          provider_id: registerProvider,
          title: registerTitle,
          source_url: registerSourceUrl,
          content_text: registerText,
          verification_status: registerStatus,
          document_type: "schedule_of_charges"
        },
        getAdminToken()
      );

      setShowRegisterModal(false);
      setRegisterTitle("");
      setRegisterSourceUrl("");
      setRegisterText("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to register source");
    } finally {
      setActionLoading(false);
      setActionMessage("");
    }
  };

  const handleReindex = async (docId: string) => {
    if (!confirm("Re-index this document into the active vector database?")) return;
    setActionLoading(true);
    setActionMessage("Re-indexing chunks into vector store...");
    try {
      await api.reindexDocument(docId, getAdminToken());
      await loadData();
    } catch (err: any) {
      alert(err.message || "Re-index failed");
    } finally {
      setActionLoading(false);
      setActionMessage("");
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This removes all associated vectors.`)) return;
    setActionLoading(true);
    setActionMessage("Deleting document and purging vectors...");
    try {
      await api.deleteDocument(docId, getAdminToken());
      await loadData();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setActionLoading(false);
      setActionMessage("");
    }
  };

  const handleInspect = async (docId: string) => {
    try {
      const detail = await api.getDocumentDetail(docId);
      setInspectDoc(detail);
    } catch (err: any) {
      alert(err.message || "Failed to fetch document chunks");
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source_url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider =
      filterProvider === "all" || doc.provider_id === filterProvider;
    const matchesStatus =
      filterStatus === "all" || doc.verification_status === filterStatus;
    return matchesSearch && matchesProvider && matchesStatus;
  });

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const historicalDocs = documents.filter((d) => d.verification_status === "historical").length;
  const unverifiedDocs = documents.filter((d) => d.verification_status === "unverified").length;

  // 1. Staff Authentication Gate - Restricted Compliance Portal
  const [showStaffLogin, setShowStaffLogin] = useState(false);

  if (!isAuthenticated && !authChecking) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-3">
            Internal Compliance Portal
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Restricted Banking Registry
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Access to this document indexing and tariff registry system is strictly limited to authorized State Bank of Pakistan compliance auditors and registered banking administrators. Unauthorized access attempts are monitored and recorded.
          </p>

          {!showStaffLogin ? (
            <div className="space-y-3">
              <Link
                href="/chat"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Public Banking Assistant</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowStaffLogin(true)}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Authorized Personnel Authentication</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-4 text-left pt-2">
              {loginError && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Compliance Officer Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@bankmate.ai"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Security Passcode
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowStaffLogin(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loginLoading ? "Verifying..." : "Verify & Enter"}</span>
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500">
              State Bank of Pakistan (SBP) Framework for Digital Financial Services
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (authChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 text-xs">
        Verifying compliance credentials...
      </div>
    );
  }

  // 2. Authenticated Staff CMS View
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Authorized Staff Active Session Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-white">Compliance Staff Gateway Active</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">User: admin@bankmate.ai</span>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-[11px] font-semibold transition-colors"
        >
          <LogOut className="w-3 h-3" />
          <span>Lock & Exit CMS</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-600" />
              <span>Official Tariff & Policy Registry</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Internal repository for Schedule of Charges (SOC), Raast policy guides, and SBP regulatory circulars.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Register Source URL</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {actionLoading && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl flex items-center space-x-2 text-xs animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span className="font-medium">{actionMessage}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Total Policies</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{documents.length}</span>
            <span className="text-[10px] text-slate-400">All registered circulars</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Indexed Chunks</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{totalChunks}</span>
            <span className="text-[10px] text-slate-400">Semantic vector records</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Active Current</span>
            <span className="text-2xl font-black text-teal-600 mt-1 block">
              {documents.length - historicalDocs - unverifiedDocs}
            </span>
            <span className="text-[10px] text-slate-400">Live authoritative</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Historical Archives</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{historicalDocs}</span>
            <span className="text-[10px] text-slate-400">Expired reference</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Registry Status</span>
            <span className="text-sm font-bold text-emerald-700 mt-1.5 block">Synchronized</span>
            <span className="text-[10px] text-slate-400">Pinecone Cloud Active</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title or URL..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Institutions</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified (Current)</option>
              <option value="historical">Historical Archive</option>
              <option value="unverified">Pending Review</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              <span>Loading registered banking policies...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No documents found matching the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Document Title & URL</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Chunks</th>
                    <th className="py-3 px-4">Effective Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 mb-0.5">{doc.title}</div>
                        <a
                          href={doc.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 truncate max-w-xs"
                        >
                          <span>{doc.source_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 capitalize">
                          {doc.provider_id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.verification_status === "verified" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : doc.verification_status === "historical" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Historical
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            <AlertCircle className="w-3 h-3 text-slate-500" />
                            Unverified
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {doc.chunk_count || 0}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {doc.effective_date || "Current"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleInspect(doc.id)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Inspect semantic chunks"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReindex(doc.id)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Re-index document"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete policy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Upload Banking Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Institution</label>
                <select
                  value={uploadProvider}
                  onChange={(e) => setUploadProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Schedule of Charges (Jul - Dec 2026)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Source URL</label>
                <input
                  type="url"
                  value={uploadSourceUrl}
                  onChange={(e) => setUploadSourceUrl(e.target.value)}
                  placeholder="https://bank.com.pk/charges.pdf"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verification Status</label>
                <select
                  value={uploadStatus}
                  onChange={(e) => setUploadStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="verified">Verified (Current Active Policy)</option>
                  <option value="historical">Historical Archive</option>
                  <option value="unverified">Draft / Pending Review</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document File (.pdf, .txt, .md, .html)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.html"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  Upload & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Source URL Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register Official Source URL</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Institution</label>
                <select
                  value={registerProvider}
                  onChange={(e) => setRegisterProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Title</label>
                <input
                  type="text"
                  value={registerTitle}
                  onChange={(e) => setRegisterTitle(e.target.value)}
                  placeholder="e.g. Raast Daily Transfer Circular"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Disclosed URL</label>
                <input
                  type="url"
                  value={registerSourceUrl}
                  onChange={(e) => setRegisterSourceUrl(e.target.value)}
                  placeholder="https://sbp.org.pk/circular.html"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Policy Text Excerpt</label>
                <textarea
                  rows={4}
                  value={registerText}
                  onChange={(e) => setRegisterText(e.target.value)}
                  placeholder="Paste official tariff excerpt or circular text here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  Save & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chunk Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{inspectDoc.title}</h3>
                  <span className="text-[11px] text-slate-400">
                    {inspectDoc.chunks?.length || inspectDoc.chunk_count || 0} Semantic Vector Chunks
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-3 pr-1">
              {inspectDoc.chunks && inspectDoc.chunks.length > 0 ? (
                inspectDoc.chunks.map((chunk, idx) => (
                  <div key={chunk.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-semibold">
                      <span>Chunk #{chunk.chunk_index} — {chunk.section_title || "General"}</span>
                      <span>Page {chunk.page_number || 1}</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-[11px]">
                      {chunk.content}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No individual chunks loaded for preview.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
