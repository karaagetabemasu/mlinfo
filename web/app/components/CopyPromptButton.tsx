"use client";

import { useState } from "react";

type Props = {
  prompt: string;
};

export default function CopyPromptButton({ prompt }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className="text-xs border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-colors"
    >
      {copied ? "コピーしました ✓" : "実装プロンプトをコピー"}
    </button>
  );
}
