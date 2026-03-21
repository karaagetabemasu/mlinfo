import Link from "next/link";
import { getArticles, getCategories, getLastUpdated } from "@/lib/data";
import SearchBar from "@/app/components/SearchBar";

export default function Home() {
  const categories = getCategories();
  const articles = getArticles();
  const lastUpdated = getLastUpdated();
  const totalArticles = articles.length || categories.flatMap((c) => c.subcategories).reduce((sum, s) => sum + s.articleCount, 0);
  const totalCategories = categories.length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-widest">MLinfo</h1>
          <span className="text-zinc-700 text-xs hidden sm:block">|</span>
          <p className="text-zinc-500 text-xs hidden sm:block">日々更新される技術をキャッチアップ</p>
        </div>
        <div className="flex items-center gap-4">
          <SearchBar />
          <div className="flex items-center gap-2 text-xs text-zinc-500 hidden sm:flex">
            <span>{totalCategories} categories</span>
            <span className="text-zinc-700">·</span>
            <span>{totalArticles} articles</span>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs tracking-widest text-zinc-500 uppercase">Categories</h2>
          {lastUpdated && (
            <span className="text-zinc-700 text-xs">最終更新: {lastUpdated.slice(0, 10)}</span>
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
                className={`border-l-2 ${category.color} border border-zinc-800 border-l-0 bg-zinc-900 p-5 hover:bg-zinc-800 hover:border-zinc-600 transition-all group`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white text-sm">{category.name}</h3>
                  <span className="text-zinc-400 text-xs font-mono">{catArticles.length}</span>
                </div>

                {/* Subcategory list */}
                <ul className="space-y-1.5 mb-3">
                  {topSubs.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between">
                      <span className="text-zinc-400 text-xs">{sub.name}</span>
                      <span className="text-zinc-600 text-xs font-mono">{sub.articleCount}</span>
                    </li>
                  ))}
                </ul>

                {/* More indicator */}
                {Object.keys(subCounts).length > 4 && (
                  <p className="text-zinc-600 text-xs">
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
