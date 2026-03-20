import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles, getCategories } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  const categories = getCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const categoryArticles = getArticles().filter((a) => a.category === id);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white text-sm transition-colors">
            MLinfo
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-semibold">{category.name}</h1>
        </div>
        <span className="text-zinc-500 text-xs">{categoryArticles.length} articles</span>
      </header>

      {/* Subcategory tags */}
      <div className="border-b border-zinc-800 px-6 py-3 flex gap-2 overflow-x-auto">
        <span className={`text-xs px-3 py-1 border-l-2 ${category.color} bg-zinc-900 text-zinc-300 border border-zinc-700 border-l-0 whitespace-nowrap`}>
          すべて <span className="text-zinc-500 ml-1">{categoryArticles.length}</span>
        </span>
        {category.subcategories.map((sub) => (
          <span key={sub.id} className="text-xs px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors whitespace-nowrap cursor-pointer">
            {sub.name} <span className="text-zinc-700 ml-1">{sub.articleCount}</span>
          </span>
        ))}
      </div>

      {/* Article list */}
      <div className="px-6 py-6 max-w-4xl mx-auto">
        {categoryArticles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm mb-1">この分類の記事はまだありません</p>
            <p className="text-zinc-700 text-xs">情報収集が完了すると自動で追加されます</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {categoryArticles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/article/${article.id}`}
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
                          <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                            code
                          </span>
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
    </main>
  );
}
