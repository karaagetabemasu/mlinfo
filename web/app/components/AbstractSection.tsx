"use client";

import { useState } from "react";

const TRUNCATE_LENGTH = 400;

function truncate(text: string): { short: string; isTruncated: boolean } {
  if (text.length <= TRUNCATE_LENGTH) return { short: text, isTruncated: false };
  const cut = text.lastIndexOf(" ", TRUNCATE_LENGTH);
  return { short: text.slice(0, cut > 0 ? cut : TRUNCATE_LENGTH), isTruncated: true };
}

type Props = {
  abstract: string;
  abstract_ja?: string;
};

export default function AbstractSection({ abstract, abstract_ja }: Props) {
  const [showJa, setShowJa] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const hasTranslation = !!abstract_ja;
  const text = showJa && abstract_ja ? abstract_ja : abstract;
  const { short, isTruncated } = truncate(text);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs tracking-widest text-zinc-400 uppercase">Abstract</span>
        {hasTranslation && (
          <button
            onClick={() => { setShowJa((v) => !v); setExpanded(false); }}
            className="text-xs border border-zinc-300 px-2 py-0.5 text-zinc-400 hover:text-zinc-700 hover:border-zinc-400 transition-colors"
          >
            {showJa ? "原文" : "日本語訳"}
          </button>
        )}
      </div>
      <p className="text-zinc-700 text-sm leading-relaxed">
        {expanded ? text : short}
        {isTruncated && !expanded && (
          <>
            {"… "}
            <button
              onClick={() => setExpanded(true)}
              className="text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
            >
              続きを読む
            </button>
          </>
        )}
      </p>
    </div>
  );
}
