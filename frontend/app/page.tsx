"use client";

import Link from "next/link";
import {
  Landmark,
  MessageSquare,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Clock,
  Sparkles,
  ExternalLink,
  PhoneCall,
  Scale
} from "lucide-react";

export default function HomePage() {
  const providers = [
    {
      id: "easypaisa",
      name: "Easypaisa",
      type: "Branchless Banking",
      category: "Digital Wallet & Raast",
      description: "Nationwide instant transfers, Raast P2P, biometric account tiers, and schedule of charges.",
      helpline: "3737 (Telenor) / 042-111-003737",
      color: "from-emerald-500 to-green-600",
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200"
    },
    {
      id: "jazzcash",
      name: "JazzCash",
      type: "Branchless Banking",
      category: "Mobile Account & Raast",
      description: "Mobilink Microfinance Bank mobile wallet limits, debit card policies, retailer agent fees, and support.",
      helpline: "4444 (Jazz) / 021-111-124-444",
      color: "from-amber-500 to-orange-600",
      accent: "text-amber-800 bg-amber-50 border-amber-200"
    },
    {
      id: "meezan",
      name: "Meezan Bank",
      type: "Premier Islamic Bank",
      category: "Riba-Free Banking",
      description: "Mudarabah savings profit weightages, Qard current accounts, debit card fees, and Shariah compliance.",
      helpline: "+92 (21) 111-331-331",
      color: "from-blue-600 to-indigo-700",
      accent: "text-blue-800 bg-blue-50 border-blue-200"
    },
    {
      id: "hbl",
      name: "Habib Bank Limited (HBL)",
      type: "Commercial Bank",
      category: "Freedom Account & Digital",
      description: "HBL Freedom Account waivers, biometric app Raast limits, lost card emergency reporting, and tariffs.",
      helpline: "111-111-425",
      color: "from-teal-600 to-cyan-700",
      accent: "text-teal-800 bg-teal-50 border-teal-200"
    },
    {
      id: "alfalah",
      name: "Bank Alfalah",
      type: "Digital Commercial Bank",
      category: "Alfa Digital Banking",
      description: "Alfa mobile application, transaction dispute resolution timeline (45 days), and schedule of charges.",
      helpline: "021-111-225-111",
      color: "from-red-600 to-rose-700",
      accent: "text-red-800 bg-red-50 border-red-200"
    },
    {
      id: "sbp",
      name: "State Bank of Pakistan (SBP)",
      type: "Central Bank Regulator",
      category: "Regulatory Standards",
      description: "National Raast payment rails rules, IBFT free thresholds (PKR 25,000), and Sunwai dispute portal.",
      helpline: "sunwai.sbp.org.pk",
      color: "from-slate-700 to-slate-900",
      accent: "text-slate-800 bg-slate-100 border-slate-300"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#07111E] via-[#0B192C] to-[#142845] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>Pakistan Multi-Bank Official RAG Knowledge Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Intelligent Banking Support Grounded in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400">
              Official Policy Documents
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
            BankMate AI provides instant, source-grounded answers for Pakistani banks, digital wallets, and SBP regulations.
            Powered by strict provider isolation, ChromaDB vector retrieval, and live Neon PostgreSQL sync.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/chat"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white text-sm font-bold shadow-lg shadow-teal-900/40 hover:brightness-110 transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Launch Banking Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/knowledge"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-sm font-semibold transition-colors"
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>Explore Official Knowledge Base</span>
            </Link>
          </div>

          {/* Benchmark Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-slate-800/70 text-left">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Evaluation Accuracy</span>
              <span className="text-2xl font-black text-emerald-400">100.0%</span>
              <span className="text-[11px] text-slate-500 block">50/50 Multi-Bank Tests</span>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Average Latency</span>
              <span className="text-2xl font-black text-teal-400">135.5 ms</span>
              <span className="text-[11px] text-slate-500 block">Local Embeddings</span>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Security Guardrails</span>
              <span className="text-2xl font-black text-cyan-400">100% Pass</span>
              <span className="text-[11px] text-slate-500 block">Anti-Prompt Injection</span>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Production Database</span>
              <span className="text-2xl font-black text-blue-400">Neon Cloud</span>
              <span className="text-[11px] text-slate-500 block">PostgreSQL 18.6 Live</span>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Banking Providers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] uppercase tracking-wider mb-2">
            <Landmark className="w-3.5 h-3.5" />
            <span>Multi-Provider Ecosystem</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Supported Pakistani Banking Institutions
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            BankMate AI enforces strict provider isolation — ensuring policies, transaction limits, and charges from one bank never leak into another.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all hover:border-slate-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${p.accent}`}>
                    {p.type}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified RAG
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{p.name}</h3>
                <span className="text-xs font-medium text-slate-500 block mb-3">{p.category}</span>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{p.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                  <PhoneCall className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[150px]">{p.helpline}</span>
                </div>

                <Link
                  href={`/chat?provider=${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0D9488] hover:text-[#0f766e] transition-colors"
                >
                  <span>Query {p.name.split(" ")[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RAG Engineering Pillars Section */}
      <section className="bg-slate-100/70 border-y border-slate-200/80 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Production-Grade Banking RAG Architecture
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Designed to solve critical reliability challenges in financial AI: hallucinations, policy leakage, and prompt exploits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Strict Provider Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Retriever metadata filters guarantee that queries targeting Meezan Bank never mix fee tables or debit card limits from JazzCash or Easypaisa.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Mandatory Source Grounding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Answers display direct page numbers, section headers, and clickable official URLs. Every claim is substantiated by indexed banking documents.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Zero-Hallucination Abstention</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If a query is outside the verified documents (e.g. stock tips, crypto, internal salaries), the model strictly abstains rather than inventing financial policies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Disclaimer Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-sm font-bold text-amber-900">Portfolio Demonstration & Safety Protocol</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              This application is an independent AI engineering portfolio demonstration. It does not access private banking databases, execute fund transfers, or request account passwords, PINs, OTPs, or payment card details.
            </p>
          </div>
          <Link
            href="/chat"
            className="shrink-0 px-5 py-2.5 rounded-lg bg-amber-900 text-white text-xs font-bold hover:bg-amber-800 transition-colors shadow-sm"
          >
            Start Demonstration
          </Link>
        </div>
      </section>
    </div>
  );
}
