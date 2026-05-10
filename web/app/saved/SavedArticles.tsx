"use client";

import type { Article, Category } from "@/app/data/dummy";
import ArticleCard from "@/app/components/ArticleCard";
import { useBookmarks } from "@/app/hooks/useBookmarks";

type Props = {
  articles: Article[];
  categories: Category[];
};

export default function SavedArticles({ articles, categories }: Props) {
  const { bookmarkIds } = useBookmarks();
  const saved = articles.filter((article) => bookmarkIds.has(article.id));

  if (saved.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 p-8 text-center">
        <h2 className="text-sm font-semibold text-zinc-900 mb-2">保存した記事はまだありません</h2>
        <p className="text-sm text-zinc-600">
          記事カードや詳細ページの星ボタンから、あとで実装したい技術を保存できます。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {saved.map((article) => (
        <ArticleCard key={article.id} article={article} categories={categories} />
      ))}
    </div>
  );
}
