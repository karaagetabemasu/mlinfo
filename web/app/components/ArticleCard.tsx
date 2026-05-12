"use client";

import Link from "next/link";
import type { Article, Category } from "@/app/data/dummy";
import BookmarkButton from "@/app/components/BookmarkButton";
import {
  estimateCost,
  estimateDifficulty,
  getArticleUrl,
  getActiveManufacturingSignals,
  getFieldTags,
  getImplementationStatus,
  getShortDescription,
  getUseCase,
} from "@/lib/articleInsights";
import { trackEvent } from "@/lib/analytics";

type Props = {
  article: Article;
  categories: Category[];
  compact?: boolean;
  onClickEvent?: "article_click" | "related_article_click";
};

export default function ArticleCard({ article, categories, compact = false, onClickEvent = "article_click" }: Props) {
  const fieldTags = getFieldTags(article, categories);
  const statuses = getImplementationStatus(article);
  const difficulty = estimateDifficulty(article);
  const cost = estimateCost(article);
  const shortDescription = getShortDescription(article);
  const href = getArticleUrl(article);
  const manufacturingSignals = getActiveManufacturingSignals(article, compact ? 2 : 4);

  return (
    <article className="h-full">
      <Link
        href={href}
        onClick={() => trackEvent(onClickEvent, { article_id: article.id, source: article.source })}
        className="block h-full bg-white border border-zinc-200 p-4 hover:bg-zinc-50 hover:border-zinc-300 transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                article.source === "arxiv" ? "bg-violet-100 text-violet-700"
                : article.source === "huggingface" ? "bg-amber-100 text-amber-700"
                : "bg-zinc-100 text-zinc-600"
              }`}>
                {article.source}
              </span>
              {statuses.slice(0, 2).map((status) => (
                <span key={status} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                  {status}
                </span>
              ))}
              <span className="text-xs text-zinc-400">{article.publishedAt}</span>
            </div>

            <h3 className="font-semibold text-sm leading-snug text-zinc-900 mb-1.5">
              {article.title}
            </h3>
            <p className="text-xs leading-relaxed text-zinc-700 mb-3">{shortDescription}</p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {manufacturingSignals.map((signal) => (
                <span key={signal.key} className="text-xs bg-cyan-50 border border-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded">
                  {signal.label}
                </span>
              ))}
              {fieldTags.map((tag) => (
                <span key={tag} className="text-xs bg-zinc-100 border border-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>

            {!compact && (
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="border border-zinc-100 bg-zinc-50 px-2 py-1.5">
                  <dt className="text-zinc-400">用途</dt>
                  <dd className="text-zinc-700 truncate">{getUseCase(article)}</dd>
                </div>
                <div className="border border-zinc-100 bg-zinc-50 px-2 py-1.5">
                  <dt className="text-zinc-400">難易度</dt>
                  <dd className="text-zinc-700">{difficulty.level}</dd>
                </div>
                <div className="border border-zinc-100 bg-zinc-50 px-2 py-1.5">
                  <dt className="text-zinc-400">コスト</dt>
                  <dd className="text-zinc-700">{cost.level}</dd>
                </div>
              </dl>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BookmarkButton id={article.id} />
            <span className="text-zinc-300 text-lg group-hover:text-zinc-500 transition-colors">→</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
