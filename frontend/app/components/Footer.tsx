"use client";

import Link from "next/link";
import { useState } from "react";
import { Landmark, ShieldCheck, Lock, ExternalLink, ChevronRight } from "lucide-react";

export default function Footer() {
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffEmail, setStaffEmail] = useState("admin@bankmate.ai");
  const [staffPassword, setStaffPassword] = useState("BankMateAdmin2026!");
  const [loginError, setLoginError] = useState("");

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffEmail === "admin@bankmate.ai" && staffPassword === "BankMateAdmin2026!") {
      localStorage.setItem("bankmate_admin_token", "demo-admin-token-jwt");
      setShowStaffModal(false);
      window.location.href = "/knowledge";
    } else {
      setLoginError("Invalid staff credentials. Access restricted.");
    }
  };

  return (
    <>
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

            {/* Regulatory & Staff Links */}
            <div>
              <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider mb-3">
                Governance & Staff
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
                <li className="pt-2">
                  <button
                    onClick={() => setShowStaffModal(true)}
                    className="text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Authorized Staff Portal</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Privacy & Safety Notice */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
            <p className="leading-relaxed">
              <strong>Notice:</strong> BankMate provides verified tariff and policy guidance based on official public banking disclosures. BankMate never requests card numbers, PINs, OTPs, or passwords.
            </p>
            <div className="shrink-0 text-slate-600">
              © 2026 BankMate. All verified circulars cited directly.
            </div>
          </div>
        </div>
      </footer>

      {/* Discrete Staff Login Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Authorized Staff Gateway</h3>
              </div>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Restricted portal for bank compliance officers to update schedules of charges.
            </p>

            <form onSubmit={handleStaffLogin} className="space-y-3">
              {loginError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Staff ID / Email</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Access Passcode</label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
