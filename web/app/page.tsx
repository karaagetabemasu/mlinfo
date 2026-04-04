import Link from "next/link";
import { getArticles, getCategories, getLastUpdated } from "@/lib/data";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";

export default function Home() {
  const categories = getCategories();
  const articles = getArticles();
  const lastUpdated = getLastUpdated();
  const totalArticles = articles.length || categories.flatMap((c) => c.subcategories).reduce((sum, s) => sum + s.articleCount, 0);
  const totalCategories = categories.length;

  const trending = articles
    .filter((a) => (a.likes_count ?? 0) > 0)
    .sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-8 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <SearchBar />
          <div className="flex items-center gap-2 text-xs text-zinc-400 hidden sm:flex">
            <span>{totalCategories} categories</span>
            <span className="text-zinc-300">·</span>
            <span>{totalArticles} articles</span>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">

        {/* 注目ランキング */}
        {trending.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">Trending</h2>
            <ol className="space-y-2">
              {trending.map((article, i) => (
                <li key={article.id}>
                  <Link
                    href={`/article/${encodeURIComponent(article.id)}`}
                    className="flex items-start gap-4 bg-white border border-zinc-200 px-4 py-3 hover:bg-zinc-50 hover:border-zinc-300 transition-all group"
                  >
                    <span className="text-zinc-300 font-mono text-sm w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                          article.source === "arxiv" ? "bg-violet-100 text-violet-700"
                          : article.source === "huggingface" ? "bg-amber-100 text-amber-700"
                          : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {article.source}
                        </span>
                        <span className="text-xs text-zinc-400">♥ {article.likes_count}</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-900 truncate">{article.title}</p>
                    </div>
                    <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs tracking-widest text-zinc-400 uppercase">Categories</h2>
          {lastUpdated && (
            <span className="text-zinc-400 text-xs">最終更新: {lastUpdated.slice(0, 10)}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category) => {
            const catArticles = articles.filter((a) => a.category === category.id);
            const subCounts = catArticles.reduce((acc, a) => {
              acc[a.subcategory] = (acc[a.subcategory] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const topSubs = category.subcategories
              .map((s) => ({ ...s, articleCount: subCounts[s.id] ?? 0 }))
              .filter((s) => s.articleCount > 0)
              .slice(0, 4);
            return (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className={`border-l-2 ${category.color} border border-zinc-200 border-l-0 bg-white p-5 hover:bg-zinc-50 hover:border-zinc-300 transition-all group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-zinc-900 text-sm">{category.name}</h3>
                  <span className="text-zinc-500 text-xs font-mono">{catArticles.length}</span>
                </div>
                <ul className="space-y-1.5 mb-3">
                  {topSubs.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between">
                      <span className="text-zinc-600 text-xs">{sub.name}</span>
                      <span className="text-zinc-500 text-xs font-mono">{sub.articleCount}</span>
                    </li>
                  ))}
                </ul>
                {Object.keys(subCounts).length > 4 && (
                  <p className="text-zinc-400 text-xs">
                    他 {Object.keys(subCounts).length - 4} サブカテゴリ →
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
