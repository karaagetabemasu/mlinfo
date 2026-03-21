"use client";

import Link from "next/link";
import { useState } from "react";
import type { Article, Category } from "@/app/data/dummy";
import { useReadArticles } from "@/app/hooks/useReadArticles";

type Source = "all" | "arxiv" | "qiita" | "zenn";
type SortKey = "date" | "likes";
type Period = "all" | "today" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  all: "全期間", today: "今日", week: "今週", month: "今月",
};

function isWithinPeriod(publishedAt: string, period: Period): boolean {
  if (period === "all") return true;
  const now = new Date();
  const pub = new Date(publishedAt);
  const diffDays = (now.getTime() - pub.getTime()) / (1000 * 60 * 60 * 24);
  if (period === "today") return diffDays < 1;
  if (period === "week") return diffDays < 7;
  if (period === "month") return diffDays < 30;
  return true;
}

type Props = {
  articles: Article[];
  category: Category;
  subcategoryNameMap: Record<string, string>;
};

export default function ArticleListWithFilter({ articles, category, subcategoryNameMap }: Props) {
  const [source, setSource] = useState<Source>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [subcategory, setSubcategory] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("all");
  const { readIds, markAllAsRead } = useReadArticles();

  const bySource = source === "all" ? articles : articles.filter((a) => a.source === source);
  const byPeriod = bySource.filter((a) => isWithinPeriod(a.publishedAt, period));

  const availableSubs = Array.from(new Set(byPeriod.map((a) => a.subcategory))).sort((a, b) =>
    (subcategoryNameMap[a] ?? a).localeCompare(subcategoryNameMap[b] ?? b, "ja")
  );

  const activeSub = availableSubs.includes(subcategory) ? subcategory : "all";

  const filtered = (activeSub === "all" ? byPeriod : byPeriod.filter((a) => a.subcategory === activeSub))
    .slice()
    .sort((a, b) => {
      if (sort === "likes") return (b.likes_count ?? 0) - (a.likes_count ?? 0);
      return b.publishedAt.localeCompare(a.publishedAt);
    });

  const showLikesSort = source !== "arxiv";
  const sortLabel = source === "qiita" ? "いいね順" : "人気順";
  const unreadCount = filtered.filter((a) => !readIds.has(a.id)).length;

  return (
    <>
      {/* ソース & ソートバー */}
      <div className="border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between gap-4 overflow-x-auto">
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
                    ? `border-l-2 ${category.color} border border-zinc-300 border-l-0 bg-zinc-100 text-zinc-800`
                    : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                }`}
              >
                {s === "all" ? "すべて" : s}
                <span className={`ml-1.5 ${active ? "text-zinc-500" : "text-zinc-300"}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setSort("date")}
            className={`text-xs px-3 py-1 border transition-colors ${sort === "date" ? "border-zinc-300 bg-zinc-100 text-zinc-800" : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
          >
            新着順
          </button>
          {showLikesSort && (
            <button
              onClick={() => setSort("likes")}
              className={`text-xs px-3 py-1 border transition-colors ${sort === "likes" ? "border-zinc-300 bg-zinc-100 text-zinc-800" : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
            >
              {sortLabel}
            </button>
          )}
        </div>
      </div>

      {/* 日付フィルター & 全既読ボタン */}
      <div className="border-b border-zinc-200 bg-white px-6 py-2 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex gap-2">
          {(["all", "today", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setSubcategory("all"); }}
              className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${
                period === p
                  ? "border-zinc-400 bg-zinc-100 text-zinc-800"
                  : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {unreadCount > 0 && (
            <span className="text-xs text-zinc-400">未読 {unreadCount}件</span>
          )}
          <button
            onClick={() => markAllAsRead(filtered.map((a) => a.id))}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            全て既読にする
          </button>
        </div>
      </div>

      {/* サブカテゴリフィルター（50音順） */}
      {availableSubs.length > 1 && (
        <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSubcategory("all")}
            className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${activeSub === "all" ? "border-zinc-300 bg-white text-zinc-800" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
          >
            すべて
          </button>
          {availableSubs.map((sub) => (
            <button
              key={sub}
              onClick={() => setSubcategory(sub)}
              className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${activeSub === sub ? "border-zinc-300 bg-white text-zinc-800" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
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
            <p className="text-zinc-500 text-sm">この条件の記事はありません</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((article) => {
              const isRead = readIds.has(article.id);
              return (
                <li key={article.id}>
                  <Link
                    href={`/article/${encodeURIComponent(article.id)}`}
                    className={`block border p-4 transition-all group ${
                      isRead
                        ? "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
                        : "bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                            article.source === "arxiv" ? "bg-violet-100 text-violet-700"
                            : article.source === "zenn" ? "bg-sky-100 text-sky-700"
                            : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {article.source}
                          </span>
                          <span className="text-xs bg-zinc-100 border border-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded">
                            {subcategoryNameMap[article.subcategory] ?? article.subcategory}
                          </span>
                          {article.hasCode && (
                            <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">code</span>
                          )}
                          {(article.likes_count ?? 0) > 0 && (
                            <span className="text-xs text-zinc-500">♥ {article.likes_count}</span>
                          )}
                          <span className={`text-xs ${isRead ? "text-zinc-400" : "text-zinc-500"}`}>{article.publishedAt}</span>
                        </div>
                        <h3 className={`font-semibold text-sm leading-snug mb-1 ${isRead ? "text-zinc-500" : "text-zinc-900"}`}>
                          {article.title}
                        </h3>
                        <p className={`text-xs leading-relaxed ${isRead ? "text-zinc-400" : "text-zinc-700"}`}>{article.summary}</p>
                      </div>
                      <span className="text-zinc-300 text-lg shrink-0 group-hover:text-zinc-500 transition-colors">→</span>
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
