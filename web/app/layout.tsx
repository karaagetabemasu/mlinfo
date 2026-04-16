import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
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
  title: {
    default: "MLinfo | 機械学習・AI論文まとめ",
    template: "%s | MLinfo",
  },
  description: "arXiv・GitHub・HuggingFaceから機械学習・AI論文を毎日収集。日本語でわかりやすく解説。機械学習エンジニア・データサイエンティスト向け。",
  verification: {
    google: "WxNLf5mcDz9v4sGSz4qE7blaPyuOEEhMh4lh_p2EELY",
  },
  openGraph: {
    siteName: "MLinfo",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-BHPR7WHHH0" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-BHPR7WHHH0');
        `}</Script>
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
