"use client";

import Link from "next/link";
import { useState } from "react";
import type { Article, Category } from "@/app/data/dummy";

type Source = "all" | "arxiv" | "qiita" | "zenn";
type SortKey = "date" | "likes";

type Props = {
  articles: Article[];
  category: Category;
  subcategoryNameMap: Record<string, string>;
};

export default function ArticleListWithFilter({ articles, category, subcategoryNameMap }: Props) {
  const [source, setSource] = useState<Source>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [subcategory, setSubcategory] = useState<string>("all");

  const bySource = source === "all" ? articles : articles.filter((a) => a.source === source);

  const availableSubs = Array.from(new Set(bySource.map((a) => a.subcategory))).sort();

  // サブカテゴリ選択がフィルター後に存在しない場合はリセット
  const activeSub = availableSubs.includes(subcategory) ? subcategory : "all";

  const filtered = (activeSub === "all" ? bySource : bySource.filter((a) => a.subcategory === activeSub))
    .slice()
    .sort((a, b) => {
      if (sort === "likes") return (b.likes_count ?? 0) - (a.likes_count ?? 0);
      return b.publishedAt.localeCompare(a.publishedAt);
    });

  const showLikesSort = source !== "arxiv";

  const sortLabel = source === "qiita" ? "いいね順" : "人気順";

  return (
    <>
      {/* ソース & ソートバー */}
      <div className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex gap-2">
          {(["all", "arxiv", "qiita", "zenn"] as Source[]).map((s) => {
            const count = s === "all" ? articles.length : articles.filter((a) => a.source === s).length;
            if (s !== "all" && count === 0) return null;
            const active = source === s;
            return (
              <button
                key={s}
                onClick={() => { setSource(s); setSubcategory("all"); if (s === "arxiv" && sort === "likes") setSort("date"); }}
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
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setSort("date")}
            className={`text-xs px-3 py-1 border transition-colors ${
              sort === "date"
                ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
            }`}
          >
            新着順
          </button>
          {showLikesSort && (
            <button
              onClick={() => setSort("likes")}
              className={`text-xs px-3 py-1 border transition-colors ${
                sort === "likes"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {sortLabel}
            </button>
          )}
        </div>
      </div>

      {/* サブカテゴリフィルター */}
      {availableSubs.length > 1 && (
        <div className="border-b border-zinc-800/50 px-6 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSubcategory("all")}
            className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${
              activeSub === "all"
                ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                : "border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600"
            }`}
          >
            すべて
          </button>
          {availableSubs.map((sub) => (
            <button
              key={sub}
              onClick={() => setSubcategory(sub)}
              className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${
                activeSub === sub
                  ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                  : "border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {subcategoryNameMap[sub] ?? sub}
            </button>
          ))}
        </div>
      )}

      {/* 記事一覧 */}
      <div className="px-6 py-6 max-w-4xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">この条件の記事はありません</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/article/${encodeURIComponent(article.id)}`}
                  className="block bg-zinc-900 border border-zinc-800 p-4 hover:bg-zinc-800 hover:border-zinc-600 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                          article.source === "arxiv"
                            ? "bg-violet-900/40 text-violet-400"
                            : article.source === "zenn"
                            ? "bg-sky-900/40 text-sky-400"
                            : "bg-emerald-900/40 text-emerald-500"
                        }`}>
                          {article.source}
                        </span>
                        <span className="text-xs bg-zinc-800/60 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                          {subcategoryNameMap[article.subcategory] ?? article.subcategory}
                        </span>
                        {article.hasCode && (
                          <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">code</span>
                        )}
                        {(article.likes_count ?? 0) > 0 && (
                          <span className="text-xs text-zinc-500">♥ {article.likes_count}</span>
                        )}
                        <span className="text-zinc-600 text-xs">{article.publishedAt}</span>
                      </div>
                      <h3 className="font-medium text-sm leading-snug text-zinc-200 group-hover:text-white mb-1">
                        {article.title}
                      </h3>
                      <p className="text-zinc-500 text-xs leading-relaxed">{article.summary}</p>
                    </div>
                    <span className="text-zinc-600 text-lg shrink-0 group-hover:text-zinc-400 transition-colors">→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
