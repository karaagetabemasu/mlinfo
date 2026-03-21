"use client";

import { useState } from "react";

type Props = {
  abstract: string;
  abstract_ja?: string;
  source: "arxiv" | "qiita";
};

export default function AbstractSection({ abstract, abstract_ja, source }: Props) {
  const [showJa, setShowJa] = useState(false);

  const hasTranslation = source === "arxiv" && !!abstract_ja;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs tracking-widest text-zinc-500 uppercase">Abstract</span>
        {hasTranslation && (
          <button
            onClick={() => setShowJa((v) => !v)}
            className="text-xs border border-zinc-700 px-2 py-0.5 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
          >
            {showJa ? "原文" : "日本語訳"}
          </button>
        )}
      </div>
      <p className="text-zinc-400 text-sm leading-relaxed">
        {showJa && abstract_ja ? abstract_ja : abstract}
      </p>
    </div>
  );
}
