"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Landmark, MessageSquare, Database, BarChart3, ShieldCheck, Lock, LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("admin@bankmate.ai");
  const [adminPassword, setAdminPassword] = useState("BankMateAdmin2026!");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("bankmate_admin_token");
    if (token) setIsAdmin(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === "admin@bankmate.ai" && adminPassword === "BankMateAdmin2026!") {
      localStorage.setItem("bankmate_admin_token", "demo-admin-token-jwt");
      setIsAdmin(true);
      setShowAdminModal(false);
      setLoginError("");
    } else {
      setLoginError("Invalid admin credentials");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bankmate_admin_token");
    setIsAdmin(false);
  };

  const navLinks = [
    { href: "/", label: "Overview", icon: Landmark },
    { href: "/chat", label: "Banking Assistant", icon: MessageSquare },
    { href: "/knowledge", label: "Knowledge Base", icon: Database },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0B192C]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] flex items-center justify-center shadow-md shadow-teal-900/30 group-hover:scale-105 transition-transform">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                BankMate <span className="text-[#14B8A6] font-extrabold text-sm px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-500/30">AI</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Multi-Bank RAG Assistant
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-[#2DD4BF] border border-slate-700 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Status / Auth */}
          <div className="flex items-center space-x-3">
            {/* Live Status Badge */}
            <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-900/90 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">Neon DB + Chroma</span>
            </div>

            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-xs bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Admin Exit</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAdminModal(true)}
                className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-[#0D9488]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Admin Authentication</h3>
                  <p className="text-xs text-slate-500">Access document upload & knowledge controls</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogin} className="mt-4 space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  required
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                Default Demo Credentials: <span className="font-semibold text-slate-800">admin@bankmate.ai</span> / <span className="font-semibold text-slate-800">BankMateAdmin2026!</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0f766e] rounded-lg shadow-sm transition-colors"
                >
                  Sign In as Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
