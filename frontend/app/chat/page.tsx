"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Landmark,
  Send,
  Sparkles,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Info,
  Clock,
  BookOpen
} from "lucide-react";
import { api, Citation, ChatResponse } from "../lib/api";

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  citations?: Citation[];
  retrieval_mode?: string;
  latency_ms?: number;
  abstention?: boolean;
  warning?: string;
  feedbackGiven?: boolean;
}

const PROVIDERS = [
  { id: "general", name: "All Institutions (General / Regulatory)", badge: "Multi-Source" },
  { id: "easypaisa", name: "Easypaisa", badge: "Branchless Wallet" },
  { id: "jazzcash", name: "JazzCash", badge: "Branchless Wallet" },
  { id: "meezan", name: "Meezan Bank", badge: "Islamic Commercial" },
  { id: "hbl", name: "Habib Bank Limited (HBL)", badge: "Commercial Bank" },
  { id: "alfalah", name: "Bank Alfalah", badge: "Digital Bank" },
  { id: "sbp", name: "State Bank of Pakistan (SBP)", badge: "Central Bank" },
];

const SUGGESTIONS_BY_PROVIDER: Record<string, string[]> = {
  easypaisa: [
    "What is the daily transaction limit for an Easypaisa Level 1 biometric verified account?",
    "Are there any fees for sending money through Raast on Easypaisa?",
    "What is the fee for an ATM cash withdrawal using an Easypaisa debit card?",
    "What is the official helpline number for Easypaisa on non-Telenor networks?"
  ],
  jazzcash: [
    "What is the daily transaction limit for JazzCash Level 0 non-biometric accounts?",
    "What is the 24/7 helpline number for Jazz subscribers contacting JazzCash?",
    "How much does a JazzCash PayPak debit card cost to issue?",
    "What is the fee for withdrawing PKR 1,000 cash at a JazzCash retailer agent?"
  ],
  meezan: [
    "Does Meezan Bank pay fixed interest on its savings accounts?",
    "What Islamic contract governs Meezan Bank Current Accounts?",
    "What is the 24/7 UAN phone number for Meezan Bank customer service?",
    "What is the annual fee for a Meezan Visa Classic Debit Card?"
  ],
  hbl: [
    "What minimum average monthly balance is required for HBL Freedom Account fee waivers?",
    "What benefits does maintaining 25,000 PKR balance provide on an HBL Freedom Account?",
    "What is the default daily Raast transfer limit on HBL Mobile?",
    "How can an HBL customer immediately block a lost debit card?"
  ],
  alfalah: [
    "What is the name of Bank Alfalah's mobile banking application?",
    "Within how many days must a Bank Alfalah customer file a Transaction Dispute Form (TDF)?",
    "Are Raast P2P transfers free on the Alfa mobile app?",
    "What is the 24/7 helpline number for Bank Alfalah?"
  ],
  sbp: [
    "What is the State Bank of Pakistan's mandatory fee directive regarding Raast P2P transfers?",
    "What is the monthly free threshold for Inter-Bank Funds Transfers (IBFT) mandated by SBP?",
    "Within what turnaround time must banks resolve consumer ATM complaints under SBP regulations?",
    "What is the name of the central bank's online consumer dispute escalation portal?"
  ],
  general: [
    "What is Raast and which banking institutions in Pakistan support it?",
    "What is the State Bank of Pakistan consumer dispute resolution timeframe across all banks?",
    "How do account limits compare between Easypaisa and JazzCash Level 1 biometric accounts?",
    "What is the mandatory SBP ceiling on Inter-Bank Funds Transfer (IBFT) charges?"
  ]
};

function ChatContent() {
  const searchParams = useSearchParams();
  const initialProvider = searchParams?.get("provider") || "general";

  const [selectedProvider, setSelectedProvider] = useState<string>(initialProvider);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      content:
        "Welcome to **BankMate**. I am an official banking support assistant grounded strictly in verified Pakistani banking disclosures, published schedules of charges, and State Bank of Pakistan regulations.\n\nSelect an institution above or ask any question regarding transaction limits, fee schedules, card charges, or regulatory circulars below.",
      retrieval_mode: "grounded_retrieval_only",
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialQueryExecuted = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const qParam = searchParams?.get("q");
    if (qParam && qParam.trim() && !initialQueryExecuted.current) {
      initialQueryExecuted.current = true;
      handleSend(qParam.trim());
    }
  }, [searchParams]);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || loading) return;

    const userMsgId = `u-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      sender: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setLoading(true);

    try {
      const response: ChatResponse = await api.sendChatMessage({
        message: text,
        provider_id: selectedProvider === "general" ? null : selectedProvider,
      });

      const assistantMessage: Message = {
        id: response.message_id || `a-${Date.now()}`,
        sender: "assistant",
        content: response.answer,
        citations: response.citations,
        retrieval_mode: response.retrieval_mode,
        latency_ms: response.latency_ms,
        abstention: response.abstention,
        warning: response.warning,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          content:
            "I encountered a temporary service error while retrieving official banking records. Please ensure the backend is running.",
          retrieval_mode: "error",
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      await api.submitFeedback(messageId, isHelpful);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedbackGiven: true } : m))
      );
    } catch (e) {
      console.error("Feedback error", e);
    }
  };

  const toggleCitation = (citationKey: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [citationKey]: !prev[citationKey],
    }));
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        content: `Conversation cleared. You are currently inquiring about **${
          PROVIDERS.find((p) => p.id === selectedProvider)?.name || "All Institutions"
        }**. Ask any question regarding account limits, Raast, or charges.`,
        retrieval_mode: "grounded_retrieval_only",
      }
    ]);
  };

  const suggestions = SUGGESTIONS_BY_PROVIDER[selectedProvider] || SUGGESTIONS_BY_PROVIDER["general"];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Top Banking Context Header */}
      <div className="bg-white border-b border-slate-200/90 shadow-xs px-4 sm:px-6 lg:px-8 py-3.5 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Provider Dropdown & Indicator */}
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Landmark className="w-4 h-4 text-[#0D9488]" />
              <span>Target Bank:</span>
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="hidden md:inline-block text-[11px] font-semibold text-[#0D9488] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              {PROVIDERS.find((p) => p.id === selectedProvider)?.badge}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Warning Alert Strip */}
      <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-center text-xs text-amber-900 font-medium flex items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Bank Security Notice: Never share OTPs, PINs, passwords, CVV, or full 16-digit payment card numbers.
        </span>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        {/* Messages Stream */}
        <div className="space-y-6 pb-6">
          {messages.map((m) => {
            const isUser = m.sender === "user";

            return (
              <div
                key={m.id}
                className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#0B192C] text-[#14B8A6] flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Landmark className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl sm:max-w-3xl rounded-2xl p-4 sm:p-5 shadow-xs ${
                    isUser
                      ? "bg-[#0D9488] text-white rounded-tr-none"
                      : "bg-white text-slate-900 border border-slate-200/90 rounded-tl-none"
                  }`}
                >
                  {/* Provider Isolation Warning Banner */}
                  {!isUser && m.warning && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">{m.warning}</div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>

                  {/* Source Citations */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#0D9488]" />
                        <span>Official Grounded Citations ({m.citations.length})</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {m.citations.map((c, idx) => {
                          const citeKey = `${m.id}-${idx}`;
                          const isExpanded = expandedCitations[citeKey];

                          return (
                            <div
                              key={idx}
                              className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 truncate max-w-[280px]">
                                    {c.document_title}
                                  </span>
                                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                                    Page {c.page_number || 1}
                                  </span>
                                  {c.verification_status === "historical" && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold">
                                      Historical
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {c.source_url && (
                                    <a
                                      href={c.source_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[#0D9488] hover:text-[#0f766e] font-semibold text-[11px] flex items-center gap-0.5"
                                    >
                                      <span>Source</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => toggleCitation(citeKey)}
                                    className="text-slate-500 hover:text-slate-700"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg leading-relaxed">
                                  <strong className="text-slate-800 block mb-1">
                                    Section: {c.section_title || "General"}
                                  </strong>
                                  <p className="italic">"{c.excerpt}"</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer Meta & Actions */}
                  {!isUser && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-2">
                        {m.latency_ms !== undefined && (
                          <span className="flex items-center gap-1 font-medium text-slate-500">
                            <Clock className="w-3 h-3" /> {m.latency_ms}ms
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
                          {m.retrieval_mode === "llm_groq" ? "Groq LLM" : "Verified RAG"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          className="hover:text-slate-700 transition-colors flex items-center gap-1"
                          title="Copy Answer"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {!m.feedbackGiven ? (
                          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                            <button
                              onClick={() => handleFeedback(m.id, true)}
                              className="hover:text-emerald-600 transition-colors"
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(m.id, false)}
                              className="hover:text-red-600 transition-colors"
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            Feedback noted
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1 font-bold text-xs">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-slate-500 text-xs animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-[#0B192C] text-[#14B8A6] flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping"></span>
                <span>Retrieving verified official banking policies...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Banking Inquiries Pills */}
        <div className="mb-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Suggested Questions ({PROVIDERS.find((p) => p.id === selectedProvider)?.name.split(" ")[0]}):</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-xs bg-white hover:bg-teal-50/80 hover:border-teal-300 text-slate-700 hover:text-teal-900 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Composer */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Ask a banking question for ${PROVIDERS.find((p) => p.id === selectedProvider)?.name}...`}
            className="flex-1 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            disabled={loading}
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-xs">
          Loading Banking Assistant...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
