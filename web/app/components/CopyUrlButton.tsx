"use client";

import { useState } from "react";

export default function CopyUrlButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-colors"
    >
      {copied ? "コピーしました ✓" : "URLをコピー"}
    </button>
  );
}
