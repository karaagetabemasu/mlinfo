"use client";

import Link from "next/link";
import { useState } from "react";
import type { Article } from "@/app/data/dummy";
import type { Category } from "@/app/data/dummy";

type Source = "all" | "arxiv" | "qiita";

type Props = {
  articles: Article[];
  category: Category;
};

export default function ArticleListWithFilter({ articles, category }: Props) {
  const [source, setSource] = useState<Source>("all");

  const filtered = source === "all" ? articles : articles.filter((a) => a.source === source);

  return (
    <>
      {/* フィルターバー */}
      <div className="border-b border-zinc-800 px-6 py-3 flex gap-2 overflow-x-auto">
        {(["all", "arxiv", "qiita"] as Source[]).map((s) => {
          const count = s === "all" ? articles.length : articles.filter((a) => a.source === s).length;
          const active = source === s;
          return (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`text-xs px-3 py-1 border whitespace-nowrap transition-colors ${
                active
                  ? `border-l-2 ${category.color} border border-zinc-600 border-l-0 bg-zinc-800 text-zinc-200`
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {s === "all" ? "すべて" : s}
              <span className={`ml-1.5 ${active ? "text-zinc-400" : "text-zinc-700"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 記事一覧 */}
      <div className="px-6 py-6 max-w-4xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">この条件の記事はありません</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((article) => {
              const displaySummary = article.abstract_ja
                ? article.abstract_ja.slice(0, 120) + (article.abstract_ja.length > 120 ? "…" : "")
                : article.summary;
              return (
                <li key={article.id}>
                  <Link
                    href={`/article/${encodeURIComponent(article.id)}`}
                    className="block bg-zinc-900 border border-zinc-800 p-4 hover:bg-zinc-800 hover:border-zinc-600 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                            article.source === "arxiv"
                              ? "bg-violet-900/40 text-violet-400"
                              : "bg-emerald-900/40 text-emerald-500"
                          }`}>
                            {article.source}
                          </span>
                          {article.hasCode && (
                            <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">code</span>
                          )}
                          <span className="text-zinc-600 text-xs">{article.publishedAt}</span>
                        </div>
                        <h3 className="font-medium text-sm leading-snug text-zinc-200 group-hover:text-white mb-1">
                          {article.title}
                        </h3>
                        <p className="text-zinc-500 text-xs leading-relaxed">{displaySummary}</p>
                      </div>
                      <span className="text-zinc-600 text-lg shrink-0 group-hover:text-zinc-400 transition-colors">→</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
