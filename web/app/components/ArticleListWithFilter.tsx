"use client";

import { useState } from "react";
import type { Article, Category } from "@/app/data/dummy";
import { TASK_TAG_LABELS } from "@/app/data/dummy";
import { useReadArticles } from "@/app/hooks/useReadArticles";
import { useBookmarks } from "@/app/hooks/useBookmarks";
import ArticleCard from "@/app/components/ArticleCard";
import { estimateCost, estimateDifficulty, getImplementationStatus } from "@/lib/articleInsights";
import { trackEvent } from "@/lib/analytics";


type Source = "all" | "arxiv" | "huggingface" | "github";
type SortKey = "date" | "likes";
type Period = "all" | "today" | "week" | "month";
type ImplementationFilter = "all" | "ready" | "github" | "huggingface";
type LevelFilter = "all" | "Easy" | "Medium" | "Hard";
type CostFilter = "all" | "Low" | "Medium" | "High";

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
  const [taskTag, setTaskTag] = useState<string>("all");
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [implementation, setImplementation] = useState<ImplementationFilter>("all");
  const [difficulty, setDifficulty] = useState<LevelFilter>("all");
  const [cost, setCost] = useState<CostFilter>("all");
  const { readIds, markAllAsRead } = useReadArticles();
  const { bookmarkIds } = useBookmarks();

  const bySource = source === "all" ? articles : articles.filter((a) => a.source === source);
  const byPeriod = bySource.filter((a) => isWithinPeriod(a.publishedAt, period));

  const availableSubs = Array.from(new Set(byPeriod.map((a) => a.subcategory))).sort((a, b) =>
    (subcategoryNameMap[a] ?? a).localeCompare(subcategoryNameMap[b] ?? b, "ja")
  );
  const activeSub = availableSubs.includes(subcategory) ? subcategory : "all";
  const bySub = activeSub === "all" ? byPeriod : byPeriod.filter((a) => a.subcategory === activeSub);

  const availableTaskTags = Array.from(
    new Set(bySub.flatMap((a) => a.tags?.task ?? []))
  ).sort((a, b) => (TASK_TAG_LABELS[a] ?? a).localeCompare(TASK_TAG_LABELS[b] ?? b, "ja"));
  const activeTaskTag = availableTaskTags.includes(taskTag) ? taskTag : "all";

  const byImplementation = bySub.filter((a) => {
    const statuses = getImplementationStatus(a);
    if (implementation === "ready") return statuses.some((status) => status !== "Paper only");
    if (implementation === "github") return statuses.includes("GitHubあり");
    if (implementation === "huggingface") return statuses.includes("Hugging Faceあり");
    return true;
  });
  const byDifficulty = difficulty === "all" ? byImplementation : byImplementation.filter((a) => estimateDifficulty(a).level === difficulty);
  const byCost = cost === "all" ? byDifficulty : byDifficulty.filter((a) => estimateCost(a).level === cost);

  const filtered = (activeTaskTag === "all" ? byCost : byCost.filter((a) => a.tags?.task.includes(activeTaskTag)))
    .filter((a) => !onlyBookmarks || bookmarkIds.has(a.id))
    .slice()
    .sort((a, b) => {
      if (sort === "likes") return (b.likes_count ?? 0) - (a.likes_count ?? 0);
      return b.publishedAt.localeCompare(a.publishedAt);
    });

  const showLikesSort = source !== "arxiv";
  const sortLabel = source === "github" ? "スター順" : "人気順";
  const unreadCount = filtered.filter((a) => !readIds.has(a.id)).length;
  const applyFilter = (name: string, value: string, action: () => void) => {
    trackEvent("filter_apply", { filter_name: name, filter_value: value, category: category.id });
    action();
  };

  return (
    <>
      {/* ソース & ソートバー */}
      <div className="border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex gap-2">
          {(["all", "arxiv", "huggingface", "github"] as Source[]).map((s) => {
            const count = s === "all" ? articles.length : articles.filter((a) => a.source === s).length;
            if (s !== "all" && count === 0) return null;
            const active = source === s;
            return (
              <button
                key={s}
                onClick={() => applyFilter("source", s, () => { setSource(s); setSubcategory("all"); setTaskTag("all"); if (s === "arxiv" && sort === "likes") setSort("date"); })}
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
            onClick={() => applyFilter("sort", "date", () => setSort("date"))}
            className={`text-xs px-3 py-1 border transition-colors ${sort === "date" ? "border-zinc-300 bg-zinc-100 text-zinc-800" : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
          >
            新着順
          </button>
          {showLikesSort && (
            <button
              onClick={() => applyFilter("sort", "likes", () => setSort("likes"))}
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
              onClick={() => applyFilter("period", p, () => { setPeriod(p); setSubcategory("all"); setTaskTag("all"); })}
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
            onClick={() => setOnlyBookmarks((v) => !v)}
            className={`text-xs transition-colors ${onlyBookmarks ? "text-amber-500 hover:text-zinc-500" : "text-zinc-400 hover:text-amber-500"}`}
          >
            ★ {onlyBookmarks ? "ブックマークのみ" : "ブックマーク"}
          </button>
          <button
            onClick={() => markAllAsRead(filtered.map((a) => a.id))}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            全て既読にする
          </button>
        </div>
      </div>

      {/* 実装・難易度・コストフィルター */}
      <div className="border-b border-zinc-100 bg-white px-6 py-2 flex gap-2 overflow-x-auto">
        {([
          ["all", "実装: すべて"],
          ["ready", "実装あり"],
          ["github", "GitHubあり"],
          ["huggingface", "HFあり"],
        ] as [ImplementationFilter, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => applyFilter("implementation", value, () => setImplementation(value))}
            className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${implementation === value ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
          >
            {label}
          </button>
        ))}
        {(["all", "Easy", "Medium", "Hard"] as LevelFilter[]).map((value) => (
          <button
            key={value}
            onClick={() => applyFilter("difficulty", value, () => setDifficulty(value))}
            className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${difficulty === value ? "border-blue-300 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
          >
            難易度: {value === "all" ? "すべて" : value}
          </button>
        ))}
        {(["all", "Low", "Medium", "High"] as CostFilter[]).map((value) => (
          <button
            key={value}
            onClick={() => applyFilter("cost", value, () => setCost(value))}
            className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${cost === value ? "border-amber-300 bg-amber-50 text-amber-700" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
          >
            コスト: {value === "all" ? "すべて" : value}
          </button>
        ))}
      </div>

      {/* サブカテゴリフィルター（50音順） */}
      {availableSubs.length > 1 && (
        <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => applyFilter("subcategory", "all", () => setSubcategory("all"))}
            className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${activeSub === "all" ? "border-zinc-300 bg-white text-zinc-800" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
          >
            すべて
          </button>
          {availableSubs.map((sub) => (
            <button
              key={sub}
              onClick={() => applyFilter("subcategory", sub, () => setSubcategory(sub))}
              className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${activeSub === sub ? "border-zinc-300 bg-white text-zinc-800" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
            >
              {subcategoryNameMap[sub] ?? sub}
            </button>
          ))}
        </div>
      )}

      {/* タスクタグフィルター */}
      {availableTaskTags.length > 1 && (
        <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => applyFilter("task_tag", "all", () => setTaskTag("all"))}
            className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${activeTaskTag === "all" ? "border-zinc-300 bg-white text-zinc-800" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
          >
            タスク: すべて
          </button>
          {availableTaskTags.map((tag) => (
            <button
              key={tag}
              onClick={() => applyFilter("task_tag", tag, () => setTaskTag(tag))}
              className={`text-xs px-2.5 py-1 border whitespace-nowrap transition-colors ${activeTaskTag === tag ? "border-blue-300 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}`}
            >
              {TASK_TAG_LABELS[tag] ?? tag}
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
          <div className="space-y-2">
            {filtered.map((article) => {
              return (
                <ArticleCard key={article.id} article={article} categories={[category]} />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
