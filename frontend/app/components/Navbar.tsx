"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Landmark, MessageSquare, ShieldCheck, ArrowRight, Settings, LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("bankmate_admin_token");
    if (token) setIsAdmin(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("bankmate_admin_token");
    setIsAdmin(false);
  };

  const navLinks = [
    { href: "/chat", label: "Ask Assistant", icon: MessageSquare },
    { href: "/#institutions", label: "Supported Banks" },
    { href: "/#standards", label: "Regulatory Standards" },
    { href: "/#tariffs", label: "Verified Tariffs" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-white transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white leading-none">
              BankMate
            </span>
            <span className="text-[11px] text-emerald-400/90 font-medium tracking-wide mt-0.5">
              Verified Banking Intelligence
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-slate-800 text-emerald-400 border border-slate-700/80"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA & Discreet Admin State */}
        <div className="flex items-center space-x-3">
          {/* Institutional Compliance Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 text-[11px] bg-slate-900/90 border border-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">SBP Regulatory Verified</span>
          </div>

          {/* Discreet Admin Session Link (Only shown when active session exists) */}
          {isAdmin && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <Link
                href="/knowledge"
                className="flex items-center space-x-1 text-xs text-slate-300 hover:text-emerald-400 py-1 px-2 rounded hover:bg-slate-900 transition-colors"
                title="Tariff Registry"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Registry</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                title="Exit Staff Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <Link
            href="/chat"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Ask Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
