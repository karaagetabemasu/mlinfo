import Link from "next/link";
import Logo from "@/app/components/Logo";
import SearchBar from "@/app/components/SearchBar";
import ArticleCard from "@/app/components/ArticleCard";
import { getArticles, getCategories, getLastUpdated } from "@/lib/data";
import { getImplementationScore, getImplementationStatus, isMaterialsInformatics } from "@/lib/articleInsights";

export const metadata = {
  title: "今週試すべきAI/機械学習実装",
  description: "今週の新着AI論文・GitHub・Hugging Faceから、実装しやすい技術と注目リポジトリをまとめます。",
};

function isRecent(publishedAt: string): boolean {
  const diff = Date.now() - new Date(publishedAt).getTime();
  return diff >= 0 && diff <= 7 * 86400000;
}

export default function WeeklyPage() {
  const articles = getArticles();
  const categories = getCategories();
  const lastUpdated = getLastUpdated();
  const recent = articles.filter((article) => isRecent(article.publishedAt));
  const source = recent.length > 0 ? recent : articles.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 80);
  const implementationPicks = source.slice().sort((a, b) => getImplementationScore(b) - getImplementationScore(a)).slice(0, 8);
  const githubPicks = source.filter((article) => article.source === "github").sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)).slice(0, 6);
  const easyPicks = source.filter((article) => getImplementationStatus(article).some((status) => status !== "Paper only")).slice(0, 6);
  const materialsPicks = source.filter(isMaterialsInformatics).slice(0, 6);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-8 py-4 flex items-center justify-between">
        <Logo />
        <SearchBar />
      </header>
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <section className="mb-8">
          <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Weekly Implementation Digest</p>
          <h1 className="text-2xl font-semibold text-zinc-950 mb-3">今週試すべきAI/機械学習実装</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">
            新着記事から、GitHub/Hugging Faceあり、実装難易度、推論コスト、人気度をもとに検証候補をまとめています。
          </p>
          {lastUpdated && <p className="text-xs text-zinc-400 mt-3">最終更新: {lastUpdated.slice(0, 10)}</p>}
        </section>

        <section className="mb-10">
          <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">実装注目ランキング</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {implementationPicks.map((article) => (
              <ArticleCard key={article.id} article={article} categories={categories} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">今週伸びたGitHub</h2>
            <div className="space-y-2">
              {githubPicks.map((article) => (
                <ArticleCard key={article.id} article={article} categories={categories} compact />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">すぐ試せる候補</h2>
            <div className="space-y-2">
              {easyPicks.map((article) => (
                <ArticleCard key={article.id} article={article} categories={categories} compact />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">Materials / 製造業候補</h2>
            <div className="space-y-2">
              {materialsPicks.map((article) => (
                <ArticleCard key={article.id} article={article} categories={categories} compact />
              ))}
              {materialsPicks.length === 0 && (
                <Link href="/topics/materials-informatics" className="block bg-white border border-zinc-200 p-4 text-sm text-zinc-600 hover:border-zinc-300">
                  Materials Informaticsのトピックページを見る →
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
