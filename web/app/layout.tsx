import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import CookieBanner from "@/app/components/CookieBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MLinfo",
  description: "日々更新される機械学習技術をキャッチアップ",
  verification: {
    google: "WxNLf5mcDz9v4sGSz4qE7blaPyuOEEhMh4lh_p2EELY",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="border-t border-zinc-200 bg-white px-8 py-4 mt-auto">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-xs text-zinc-400">© 2026 MLinfo</span>
            <Link href="/privacy" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
              プライバシーポリシー
            </Link>
          </div>
        </footer>
        <CookieBanner />
      </body>
    </html>
  );
}
