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
  summary_ja?: string;
};

export default function AbstractSection({ abstract, summary_ja }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const { short, isTruncated } = truncate(abstract);

  if (summary_ja) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs tracking-widest text-zinc-400 uppercase">概要</span>
        </div>
        <p className="text-zinc-700 text-sm leading-relaxed mb-3">{summary_ja}</p>
        {!showOriginal ? (
          <button
            onClick={() => setShowOriginal(true)}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors"
          >
            原文 (English) を表示
          </button>
        ) : (
          <div className="mt-3 border-t border-zinc-100 pt-3">
            <span className="text-xs tracking-widest text-zinc-400 uppercase block mb-2">Abstract</span>
            <p className="text-zinc-500 text-xs leading-relaxed">
              {expanded ? abstract : short}
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
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs tracking-widest text-zinc-400 uppercase">Abstract</span>
      </div>
      <p className="text-zinc-700 text-sm leading-relaxed">
        {expanded ? abstract : short}
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
