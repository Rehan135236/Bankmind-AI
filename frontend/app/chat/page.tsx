"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Landmark,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Clock,
  BookOpen,
  ArrowRight,
  HelpCircle,
  CreditCard,
  Percent,
  Scale,
  RefreshCw
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

interface ProviderMeta {
  id: string;
  name: string;
  shortName: string;
  category: string;
  iconEmoji: string;
  badgeBg: string;
  description: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: "general",
    name: "All Institutions (General / SBP)",
    shortName: "All Banks",
    category: "Multi-Source",
    iconEmoji: "🌐",
    badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
    description: "Compare policies, SBP regulations, and universal Raast directives",
  },
  {
    id: "easypaisa",
    name: "Easypaisa (Telenor Microfinance Bank)",
    shortName: "Easypaisa",
    category: "Branchless Wallet",
    iconEmoji: "🟢",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Level 0/1 limits, PayPak debit card, Raast transfers, cash-in/out fees",
  },
  {
    id: "jazzcash",
    name: "JazzCash (Mobilink Microfinance Bank)",
    shortName: "JazzCash",
    category: "Branchless Wallet",
    iconEmoji: "🔴",
    badgeBg: "bg-orange-50 text-orange-800 border-orange-200",
    description: "Account limits, retailer agent withdrawal fees, card issuance charges",
  },
  {
    id: "meezan",
    name: "Meezan Bank (Islamic Commercial)",
    shortName: "Meezan Bank",
    category: "Islamic Commercial",
    iconEmoji: "🕌",
    badgeBg: "bg-emerald-50 text-emerald-900 border-emerald-300",
    description: "Shariah Mudarabah contracts, Visa debit tariffs, zero-Riba policy",
  },
  {
    id: "hbl",
    name: "Habib Bank Limited (HBL)",
    shortName: "HBL",
    category: "Commercial Bank",
    iconEmoji: "🏛️",
    badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
    description: "Freedom Account fee waivers, HBL Mobile limits, card blocking SLAs",
  },
  {
    id: "alfalah",
    name: "Bank Alfalah (Alfa)",
    shortName: "Bank Alfalah",
    category: "Digital Bank",
    iconEmoji: "🔴",
    badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
    description: "Alfa mobile app, Transaction Dispute Form (TDF) rules, debit cards",
  },
  {
    id: "sbp",
    name: "State Bank of Pakistan (SBP)",
    shortName: "SBP Central Bank",
    category: "Central Regulator",
    iconEmoji: "⚖️",
    badgeBg: "bg-blue-50 text-blue-900 border-blue-200",
    description: "Mandatory IBFT ceilings, Raast zero-fee circulars, Sunwai dispute portal",
  },
];

const STARTER_PROMPTS: Record<string, { icon: any; title: string; prompt: string }[]> = {
  general: [
    {
      icon: Scale,
      title: "Universal Raast Directive",
      prompt: "What is the State Bank of Pakistan's mandatory fee directive regarding Raast P2P transfers?"
    },
    {
      icon: Percent,
      title: "IBFT Fee Caps",
      prompt: "What is the monthly free threshold for Inter-Bank Funds Transfers (IBFT) mandated by SBP?"
    },
    {
      icon: CreditCard,
      title: "Wallet Limits Comparison",
      prompt: "How do account limits compare between Easypaisa and JazzCash Level 1 biometric accounts?"
    },
    {
      icon: HelpCircle,
      title: "Dispute Resolution SLA",
      prompt: "What is the State Bank of Pakistan consumer dispute resolution timeframe across all banks?"
    }
  ],
  easypaisa: [
    {
      icon: CreditCard,
      title: "Level 1 Biometric Limits",
      prompt: "What is the daily transaction limit for an Easypaisa Level 1 biometric verified account?"
    },
    {
      icon: Scale,
      title: "Raast Transfer Charges",
      prompt: "Are there any fees for sending money through Raast on Easypaisa?"
    },
    {
      icon: Percent,
      title: "ATM Cash Withdrawal Fee",
      prompt: "What is the fee for an ATM cash withdrawal using an Easypaisa debit card?"
    },
    {
      icon: HelpCircle,
      title: "Official Helpline",
      prompt: "What is the official helpline number for Easypaisa on non-Telenor networks?"
    }
  ],
  jazzcash: [
    {
      icon: CreditCard,
      title: "Level 0 Account Limits",
      prompt: "What is the daily transaction limit for JazzCash Level 0 non-biometric accounts?"
    },
    {
      icon: Percent,
      title: "Retailer Agent Cash-Out",
      prompt: "What is the fee for withdrawing PKR 1,000 cash at a JazzCash retailer agent?"
    },
    {
      icon: CreditCard,
      title: "PayPak Card Cost",
      prompt: "How much does a JazzCash PayPak debit card cost to issue?"
    },
    {
      icon: HelpCircle,
      title: "24/7 Helpline",
      prompt: "What is the 24/7 helpline number for Jazz subscribers contacting JazzCash?"
    }
  ],
  meezan: [
    {
      icon: Scale,
      title: "Islamic Current Account",
      prompt: "What Islamic contract governs Meezan Bank Current Accounts and why is it interest-free?"
    },
    {
      icon: Percent,
      title: "Savings Account Contract",
      prompt: "Does Meezan Bank pay fixed interest on its savings accounts or is it Mudarabah profit sharing?"
    },
    {
      icon: CreditCard,
      title: "Visa Classic Debit Card",
      prompt: "What is the annual fee for a Meezan Visa Classic Debit Card?"
    },
    {
      icon: HelpCircle,
      title: "Meezan 24/7 UAN",
      prompt: "What is the 24/7 UAN phone number for Meezan Bank customer service?"
    }
  ],
  hbl: [
    {
      icon: Percent,
      title: "Freedom Account Waivers",
      prompt: "What minimum average monthly balance is required for HBL Freedom Account fee waivers?"
    },
    {
      icon: CreditCard,
      title: "Raast Transfer Limit",
      prompt: "What is the default daily Raast transfer limit on HBL Mobile?"
    },
    {
      icon: HelpCircle,
      title: "Immediate Card Blocking",
      prompt: "How can an HBL customer immediately block a lost debit card?"
    },
    {
      icon: Scale,
      title: "Freedom Account Benefits",
      prompt: "What benefits does maintaining 25,000 PKR balance provide on an HBL Freedom Account?"
    }
  ],
  alfalah: [
    {
      icon: HelpCircle,
      title: "Dispute Form (TDF) Timeline",
      prompt: "Within how many days must a Bank Alfalah customer file a Transaction Dispute Form (TDF)?"
    },
    {
      icon: Scale,
      title: "Alfa App Raast Fees",
      prompt: "Are Raast P2P transfers free on the Alfa mobile app?"
    },
    {
      icon: CreditCard,
      title: "Mobile App Capabilities",
      prompt: "What is the name of Bank Alfalah's mobile banking application and what self-service options exist?"
    },
    {
      icon: HelpCircle,
      title: "Bank Alfalah Helpline",
      prompt: "What is the 24/7 helpline number for Bank Alfalah?"
    }
  ],
  sbp: [
    {
      icon: Scale,
      title: "Mandatory Raast Directive",
      prompt: "What is the State Bank of Pakistan's mandatory fee directive regarding Raast P2P transfers?"
    },
    {
      icon: Percent,
      title: "IBFT Free Threshold",
      prompt: "What is the monthly free threshold for Inter-Bank Funds Transfers (IBFT) mandated by SBP?"
    },
    {
      icon: HelpCircle,
      title: "ATM Complaint Resolution SLA",
      prompt: "Within what turnaround time must banks resolve consumer ATM complaints under SBP regulations?"
    },
    {
      icon: Scale,
      title: "Sunwai Portal Escalation",
      prompt: "What is the name of the central bank's online consumer dispute escalation portal?"
    }
  ]
};

// Formatter to render structured text with crisp headers, styled bullets, and bold highlights
function FormattedAssistantContent({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();

        // Check if paragraph is a list
        if (trimmed.includes("\n* ") || trimmed.includes("\n- ") || trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const lines = trimmed.split("\n");
          return (
            <div key={idx} className="space-y-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim();
                const isBullet = cleanLine.startsWith("* ") || cleanLine.startsWith("- ");
                const bulletContent = isBullet ? cleanLine.substring(2) : cleanLine;

                if (!isBullet) {
                  return (
                    <p key={lIdx} className="font-semibold text-slate-900 mt-2">
                      {renderFormattedInline(cleanLine)}
                    </p>
                  );
                }

                return (
                  <div key={lIdx} className="flex items-start gap-2.5 pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-2"></span>
                    <div className="flex-1 text-slate-700">
                      {renderFormattedInline(bulletContent)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Check if numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const lines = trimmed.split("\n");
          return (
            <div key={idx} className="space-y-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim();
                const match = cleanLine.match(/^(\d+)\.\s(.*)/);
                if (match) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 pl-1">
                      <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {match[1]}
                      </span>
                      <div className="flex-1 text-slate-700">
                        {renderFormattedInline(match[2])}
                      </div>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="text-slate-800">
                    {renderFormattedInline(cleanLine)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-slate-800">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Inline formatting helper for bolding and key markers
function renderFormattedInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={i} className="font-bold text-slate-950">
          {boldText}
        </strong>
      );
    }
    return part;
  });
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialProvider = searchParams?.get("provider") || "general";

  const [selectedProvider, setSelectedProvider] = useState<string>(initialProvider);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialQueryExecuted = useRef(false);

  const activeProvider = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];
  const starterCards = STARTER_PROMPTS[selectedProvider] || STARTER_PROMPTS["general"];

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
            "I encountered a temporary network delay retrieving verified banking tariffs. Please verify that the backend service is operational and try again.",
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
    setMessages([]);
  };

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* 1. Sleek Top Banking Context Bar */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs px-4 sm:px-6 py-2.5 shrink-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Active Bank Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bank:</span>
            </span>

            {PROVIDERS.map((p) => {
              const isSelected = selectedProvider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                  }`}
                >
                  <span>{p.iconEmoji}</span>
                  <span>{p.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Institutional Compliance Badge & Clear Action */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">2026 Tariff Schedules Active</span>
              <span className="sm:hidden">Active Tariffs</span>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Security Disclaimer Strip */}
      <div className="bg-emerald-950 text-emerald-200/90 border-b border-emerald-900/60 px-4 py-1.5 text-center text-[11px] font-medium flex items-center justify-center gap-1.5 shrink-0">
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          Bank Security Notice: Never share OTPs, PINs, passwords, or full 16-digit debit card numbers.
        </span>
      </div>

      {/* 3. Messages Stream (Scrollable Viewport) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome View / Empty State */}
          {messages.length === 0 && (
            <div className="py-8 sm:py-12 animate-in fade-in duration-300">
              <div className="text-center max-w-xl mx-auto mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-900/20">
                  <Landmark className="w-7 h-7" />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                  {activeProvider.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {activeProvider.description}. Sourced directly from verified regulatory circulars and schedules of charges.
                </p>
              </div>

              {/* Starter Question Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
                {starterCards.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.prompt)}
                      className="group bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl p-4 text-left shadow-2xs hover:shadow-xs transition-all flex items-start gap-3.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 mb-1 group-hover:text-emerald-900 flex items-center justify-between">
                          <span>{item.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-emerald-600 transition-all" />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {item.prompt}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Conversation Messages */}
          {messages.map((m) => {
            const isUser = m.sender === "user";

            return (
              <div
                key={m.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Landmark className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl sm:max-w-3xl rounded-2xl p-4 sm:p-5 shadow-xs ${
                    isUser
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-xs"
                      : "bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  {/* Provider Isolation Warning Banner */}
                  {!isUser && m.warning && (
                    <div className="mb-3.5 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">{m.warning}</div>
                    </div>
                  )}

                  {/* Message Content */}
                  {isUser ? (
                    <div className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : (
                    <FormattedAssistantContent text={m.content} />
                  )}

                  {/* Source Citations Drawer */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Official Grounded Citations ({m.citations.length})</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {m.citations.map((c, idx) => {
                          const citeKey = `${m.id}-${idx}`;
                          const isExpanded = expandedCitations[citeKey];

                          return (
                            <div
                              key={idx}
                              className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
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

                                <div className="flex items-center gap-2 shrink-0">
                                  {c.source_url && (
                                    <a
                                      href={c.source_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-700 hover:text-emerald-900 font-semibold text-[11px] flex items-center gap-0.5"
                                    >
                                      <span>Source</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => toggleCitation(citeKey)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5"
                                    title={isExpanded ? "Collapse excerpt" : "Expand excerpt"}
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
                                <div className="mt-2.5 pt-2.5 border-t border-slate-200/90 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg leading-relaxed">
                                  <strong className="text-slate-800 block mb-1">
                                    Section: {c.section_title || "General"}
                                  </strong>
                                  <p className="italic text-slate-700">"{c.excerpt}"</p>
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
                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-2">
                        {m.latency_ms !== undefined && (
                          <span className="flex items-center gap-1 font-medium text-slate-500">
                            <Clock className="w-3 h-3" /> {m.latency_ms}ms
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
                          Verified Tariff Grounding
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          className="hover:text-slate-700 transition-colors flex items-center gap-1 p-1"
                          title="Copy Answer"
                        >
                          {copiedId === m.id ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[10px]">
                              <Check className="w-3.5 h-3.5" /> Copied
                            </span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {!m.feedbackGiven ? (
                          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                            <button
                              onClick={() => handleFeedback(m.id, true)}
                              className="hover:text-emerald-600 transition-colors p-1"
                              title="Helpful response"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(m.id, false)}
                              className="hover:text-rose-600 transition-colors p-1"
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-semibold pl-1">
                            Feedback noted
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-1 font-bold text-xs">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-3 text-slate-500 text-xs animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span className="text-slate-700 font-medium">
                  Consulting official schedules of charges and SBP circulars...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 4. Floating Composer Dock (Pinned Bottom) */}
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-3 shrink-0 z-20">
        <div className="max-w-4xl mx-auto">
          {/* Quick Suggestion Pills */}
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Suggested:</span>
              </span>
              {starterCards.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="text-xs whitespace-nowrap bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-slate-700 px-3 py-1 rounded-full transition-colors"
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Capsule */}
          <div className="bg-slate-50 border border-slate-300/80 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl p-1.5 flex items-center gap-2 transition-all shadow-xs">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Ask a banking question regarding ${activeProvider.shortName}...`}
              className="flex-1 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              disabled={loading}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Footnote Disclaimers */}
          <div className="mt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <span>Official tariffs cited directly</span>
            <span>•</span>
            <span>Zero-hallucination policy grounding</span>
            <span>•</span>
            <Link href="/#institutions" className="hover:text-emerald-600 underline">
              View all 6 institutions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100dvh-4rem)] flex items-center justify-center p-12 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading Banking Assistant...</span>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
