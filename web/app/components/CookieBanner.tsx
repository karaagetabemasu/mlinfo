"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const STORAGE_KEY = "mlinfo_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-zinc-600 leading-relaxed">
          本サービスでは、広告配信およびアクセス解析のためにCookieを使用します。
          サービスを継続して利用することで、
          <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-900 transition-colors mx-1">
            プライバシーポリシー
          </Link>
          に同意したものとみなします。
        </p>
        <button
          onClick={accept}
          className="shrink-0 text-xs bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-700 transition-colors"
        >
          同意する
        </button>
      </div>
    </div>
  );
}
