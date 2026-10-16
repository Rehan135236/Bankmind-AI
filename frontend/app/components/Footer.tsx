"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, ShieldCheck, ExternalLink, ChevronRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Do not render the footer on the interactive chat screen
  if (pathname === "/chat" || pathname?.startsWith("/chat")) {
    return null;
  }

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 text-xs py-14 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-slate-900">
          {/* Brand Information */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950/40">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-base tracking-tight">BankMate</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Independent multi-bank intelligence platform delivering certified, source-grounded banking answers across official schedules of charges, Raast transaction rails, and State Bank of Pakistan consumer protection directives.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-Hallucination Policy Grounding</span>
              <span>•</span>
              <span>Strict Provider Isolation</span>
            </div>
          </div>

          {/* Supported Banks */}
          <div>
            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider mb-3">
              Covered Institutions
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><Link href="/chat?provider=easypaisa" className="hover:text-emerald-400 transition-colors">Easypaisa (TBM)</Link></li>
              <li><Link href="/chat?provider=jazzcash" className="hover:text-emerald-400 transition-colors">JazzCash (MMBL)</Link></li>
              <li><Link href="/chat?provider=meezan" className="hover:text-emerald-400 transition-colors">Meezan Bank (Islamic)</Link></li>
              <li><Link href="/chat?provider=hbl" className="hover:text-emerald-400 transition-colors">Habib Bank Limited (HBL)</Link></li>
              <li><Link href="/chat?provider=alfalah" className="hover:text-emerald-400 transition-colors">Bank Alfalah (Alfa)</Link></li>
              <li><Link href="/chat?provider=sbp" className="hover:text-emerald-400 transition-colors">State Bank of Pakistan (SBP)</Link></li>
            </ul>
          </div>

          {/* Regulatory & Consumer Links */}
          <div>
            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider mb-3">
              Governance & Oversight
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href="/chat" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Ask Banking Questions</span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <a
                  href="https://www.sbp.org.pk/dfs/Payments.html"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <span>SBP Payment Systems</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://sunwai.sbp.org.pk"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <span>SBP Sunwai Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Privacy & Safety Notice */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
          <p className="leading-relaxed">
            <strong>Consumer Notice:</strong> BankMate provides verified tariff and policy guidance based on official public banking disclosures. BankMate never requests card numbers, PINs, OTPs, or passwords.
          </p>
          <div className="shrink-0 text-slate-600">
            © 2026 BankMate. All verified circulars cited directly.
          </div>
        </div>
      </div>
    </footer>
  );
}
