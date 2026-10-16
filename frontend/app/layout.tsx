import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BankMate — Verified Banking Assistant & Tariff Intelligence",
  description: "Instant, verified banking answers grounded in official schedules of charges and State Bank of Pakistan regulations for commercial banks and digital wallets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className={`${jakarta.className} min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-teal-600 selection:text-white`}>
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
