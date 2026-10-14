"use client";

import Link from "next/link";
import { Landmark, ShieldAlert, FileText, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#07111E] text-slate-400 border-t border-slate-800 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center text-white font-bold">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-base tracking-tight">BankMate AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              Multi-Bank Intelligent Banking Support Agent for Pakistan, powered by Retrieval-Augmented Generation (RAG).
              Provides source-grounded answers across official banking policies, schedules of charges, and SBP regulations.
            </p>
            <div className="flex items-center space-x-4 pt-1 text-[11px] text-slate-500">
              <span>PostgreSQL (Neon)</span>
              <span>•</span>
              <span>ChromaDB Vector Store</span>
              <span>•</span>
              <span>HuggingFace MiniLM-L6-v2</span>
            </div>
          </div>

          {/* Supported Providers */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3">Supported Institutions</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>Easypaisa (TBM)</li>
              <li>JazzCash (MMBL)</li>
              <li>Meezan Bank (Islamic)</li>
              <li>Habib Bank Limited (HBL)</li>
              <li>Bank Alfalah (Alfa)</li>
              <li>State Bank of Pakistan (SBP)</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3">Platform & Compliance</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <Link href="/chat" className="hover:text-teal-400 transition-colors">Customer Banking Assistant</Link>
              </li>
              <li>
                <Link href="/knowledge" className="hover:text-teal-400 transition-colors">Official Document Registry</Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-teal-400 transition-colors">Evaluation & Performance</Link>
              </li>
              <li>
                <a
                  href="https://www.sbp.org.pk/dfs/Payments.html"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal-400 transition-colors flex items-center gap-1"
                >
                  SBP Raast Directives <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Independent Portfolio Project:</strong> BankMate AI is an engineering demonstration and not an official service of any referenced bank. Never enter OTPs, PINs, or credentials.
            </span>
          </div>
          <div>
            © 2026 BankMate AI. Open-source portfolio demonstration.
          </div>
        </div>
      </div>
    </footer>
  );
}
