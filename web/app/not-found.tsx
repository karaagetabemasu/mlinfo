import Link from "next/link";
import { getArticles, getCategories } from "@/lib/data";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";
import ArticleCard from "@/app/components/ArticleCard";

export default function NotFound() {
  const articles = getArticles();
  const categories = getCategories();
  const popularArticles = articles.slice().sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)).slice(0, 3);
  const latestArticles = articles.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <Logo />
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900">トップへ戻る</Link>
      </header>

      <div className="px-6 py-10 max-w-5xl mx-auto">
        <section className="mb-8">
          <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">404</p>
          <h1 className="text-2xl font-semibold text-zinc-950 mb-3">ページが見つかりません</h1>
          <p className="text-sm text-zinc-600 mb-5">
            記事URLが変更されたか、まだ収集されていない可能性があります。検索、人気記事、新着記事、カテゴリから近い技術を探せます。
          </p>
          <SearchBar />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">人気記事</h2>
            <div className="space-y-2">
              {popularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} categories={categories} compact />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">新着記事</h2>
            <div className="space-y-2">
              {latestArticles.map((article) => (
                <ArticleCard key={article.id} article={article} categories={categories} compact />
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">カテゴリ</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map((category) => (
              <Link key={category.id} href={`/category/${category.id}`} className="bg-white border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:border-zinc-300">
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
