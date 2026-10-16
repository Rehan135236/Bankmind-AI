"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Landmark,
  MessageSquare,
  ShieldCheck,
  Search,
  ArrowRight,
  CheckCircle2,
  FileText,
  PhoneCall,
  Scale,
  Lock,
  ChevronRight,
  HelpCircle,
  ExternalLink
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      router.push(`/chat?q=${encodeURIComponent(heroQuery.trim())}`);
    } else {
      router.push("/chat");
    }
  };

  const providers = [
    {
      id: "easypaisa",
      name: "Easypaisa",
      institutionType: "Branchless Banking & Wallet",
      tagline: "Raast P2P, Biometric Tiers & PayPak Tariffs",
      helpline: "3737 (Telenor) / 042-111-003737",
      sampleQuestions: [
        "What is the daily sending limit for Level 2 biometric accounts?",
        "What is the ATM withdrawal fee on Easypaisa PayPak debit card?"
      ],
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      accentBorder: "hover:border-emerald-500",
    },
    {
      id: "jazzcash",
      name: "JazzCash",
      institutionType: "Branchless Banking & Wallet",
      tagline: "Mobile Accounts, Cash-Out Tariffs & Limits",
      helpline: "4444 (Jazz) / 021-111-124-444",
      sampleQuestions: [
        "What is the fee for withdrawing PKR 1,000 at a JazzCash retailer?",
        "What are the daily and monthly limits on JazzCash Level 1?"
      ],
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      accentBorder: "hover:border-amber-500",
    },
    {
      id: "meezan",
      name: "Meezan Bank",
      institutionType: "Premier Islamic Commercial Bank",
      tagline: "Mudarabah Profit Weightages, Qard & Visa Tariffs",
      helpline: "+92 (21) 111-331-331",
      sampleQuestions: [
        "Does Meezan Bank pay fixed interest or Mudarabah profit?",
        "What is the annual fee for a Meezan Visa Classic debit card?"
      ],
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      accentBorder: "hover:border-blue-500",
    },
    {
      id: "hbl",
      name: "Habib Bank Limited (HBL)",
      institutionType: "Commercial Bank",
      tagline: "Freedom Account Waivers, Raast & Card Tariffs",
      helpline: "111-111-425",
      sampleQuestions: [
        "What minimum balance is required to waive HBL Freedom Account fees?",
        "How can I immediately report and block a lost HBL debit card?"
      ],
      badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
      accentBorder: "hover:border-teal-500",
    },
    {
      id: "alfalah",
      name: "Bank Alfalah",
      institutionType: "Digital Commercial Bank",
      tagline: "Alfa App, Dispute Redressal & Account Limits",
      helpline: "021-111-225-111",
      sampleQuestions: [
        "Within how many days must a dispute form (TDF) be filed?",
        "Are Raast P2P transfers free on the Alfa mobile app?"
      ],
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
      accentBorder: "hover:border-rose-500",
    },
    {
      id: "sbp",
      name: "State Bank of Pakistan (SBP)",
      institutionType: "Central Bank & National Regulator",
      tagline: "Sovereign Raast Mandate, IBFT Thresholds & Sunwai",
      helpline: "sunwai.sbp.org.pk",
      sampleQuestions: [
        "What is the SBP free monthly threshold for IBFT transfers?",
        "What is the central bank's maximum allowable fee for IBFT above 25k?"
      ],
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      accentBorder: "hover:border-slate-500",
    }
  ];

  const popularQueries = [
    { text: "Are Raast transfers free across all banks?", provider: "sbp" },
    { text: "Easypaisa ATM withdrawal fee at 1Link ATMs", provider: "easypaisa" },
    { text: "Meezan Bank debit card annual charges", provider: "meezan" },
    { text: "HBL Freedom Account minimum balance waiver", provider: "hbl" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Grounded in Official Schedules of Charges & SBP Circulars</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Verified Banking Tariffs & Limits,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Instantly Answered.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Get accurate, source-cited banking answers for Pakistani commercial banks, digital wallets, and central bank regulations — with zero guesswork and direct official document proof.
          </p>

          {/* Interactive Hero Search Form */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row items-center gap-2 mb-6 focus-within:border-emerald-500 transition-colors"
          >
            <div className="flex items-center gap-3 px-3 w-full">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Ask any banking question (e.g. Raast limits, ATM charges, fee waivers)..."
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none py-2"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all shrink-0 hover:scale-[1.02]"
            >
              <span>Ask BankMate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Suggested Quick Queries */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="text-slate-400 font-medium mr-1">Popular inquiries:</span>
            {popularQueries.map((item, idx) => (
              <Link
                key={idx}
                href={`/chat?provider=${item.provider}&q=${encodeURIComponent(item.text)}`}
                className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1 rounded-full border border-slate-800 transition-colors"
              >
                {item.text}
              </Link>
            ))}
          </div>

          {/* Trust Assurances */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-slate-800/80 text-left">
            <div className="p-3">
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>100% Document Grounded</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Every claim is substantiated by published Schedules of Charges.
              </p>
            </div>

            <div className="p-3">
              <div className="flex items-center gap-1.5 text-teal-400 text-sm font-bold mb-1">
                <Scale className="w-4 h-4 shrink-0" />
                <span>Strict Provider Isolation</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Competitor charges and limits never cross-contaminate your answer.
              </p>
            </div>

            <div className="p-3">
              <div className="flex items-center gap-1.5 text-cyan-400 text-sm font-bold mb-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>SBP Regulatory Guardrails</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Strict adherence to State Bank consumer protection circulars.
              </p>
            </div>

            <div className="p-3">
              <div className="flex items-center gap-1.5 text-blue-400 text-sm font-bold mb-1">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Zero Credential Risk</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                No passwords, card numbers, or PINs are ever asked or stored.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Banking Institutions Section */}
      <section id="institutions" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Landmark className="w-3.5 h-3.5" />
            <span>Multi-Bank Intelligence</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Supported Pakistani Financial Institutions
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Select an institution below to query verified fee schedules, account limits, card policies, and official helpline support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all ${p.accentBorder} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${p.badgeColor}`}>
                    {p.institutionType}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{p.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{p.tagline}</p>

                {/* Direct Sample Questions */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Common Inquiries:
                  </span>
                  {p.sampleQuestions.map((q, qIdx) => (
                    <Link
                      key={qIdx}
                      href={`/chat?provider=${p.id}&q=${encodeURIComponent(q)}`}
                      className="block text-xs text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/60 p-2.5 rounded-lg border border-slate-100 transition-colors"
                    >
                      "{q}"
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[140px]">{p.helpline}</span>
                </div>

                <Link
                  href={`/chat?provider=${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Query {p.name.split(" ")[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Institutional Standards & Policies Section */}
      <section id="standards" className="bg-slate-50 border-y border-slate-200/90 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Financial Accuracy Demands Policy Grounding
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Unlike generic chatbots that guess banking numbers, BankMate is engineered with institutional safeguards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Strict Provider Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you ask about Meezan Bank, our pipeline enforces strict metadata boundary isolation so competitors' tariffs and limits never leak into your answer.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Authoritative Document Citations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every response provides verifiable evidence: document titles, page numbers, and direct official URLs so consumers can verify facts independently.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Zero-Hallucination Safe Abstention</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If information is outside verified banking circulars (such as crypto exchanges or CEO salaries), BankMate transparently abstains instead of inventing figures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section id="tariffs" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Consumer Guidance</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Banking Questions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Are Raast Person-to-Person (P2P) transfers always free?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Yes. Under State Bank of Pakistan (SBP) regulatory directives, all Raast P2P transfers are strictly free of charge across all participating commercial banks and digital microfinance wallets.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              What is the fee for Inter-Bank Funds Transfer (IBFT via 1Link)?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              SBP circulars mandate that customers receive free IBFT transfers up to PKR 25,000 per month per account. For transfers exceeding this monthly threshold, banks may charge a maximum of 0.1% of the transaction amount or PKR 200, whichever is lower.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              How does BankMate handle expired or historical fee schedules?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Historical fee schedules are clearly labeled as <code>[HISTORICAL ARCHIVE]</code> to prevent confusion while allowing customers to audit past disputes accurately.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-950/30 transition-all hover:scale-[1.02]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Start Asking Questions</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
