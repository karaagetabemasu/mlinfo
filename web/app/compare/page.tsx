import Link from "next/link";
import Logo from "@/app/components/Logo";
import SearchBar from "@/app/components/SearchBar";
import ArticleCard from "@/app/components/ArticleCard";
import { getArticles, getCategories } from "@/lib/data";
import { estimateCost, estimateDifficulty, getImplementationScore, getImplementationStatus, matchesKeywords } from "@/lib/articleInsights";
import { comparisons } from "@/lib/topicCatalog";

export const metadata = {
  title: "AI/機械学習手法比較",
  description: "RAG、LLM fine-tuning、異常検知などの技術候補を、実装可否・難易度・推論コストから比較します。",
};

export default function ComparePage() {
  const articles = getArticles();
  const categories = getCategories();

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <Logo />
        <SearchBar />
      </header>
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <section className="mb-8">
          <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Compare</p>
          <h1 className="text-2xl font-semibold text-zinc-950 mb-3">AI/機械学習手法比較</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">
            エンジニアが技術選定で迷いやすい領域を、実装可否、難易度、コスト、用途の観点で比較できる入口です。
          </p>
        </section>

        <div className="space-y-10">
          {comparisons.map((comparison) => {
            const matched = articles
              .filter((article) => matchesKeywords(article, comparison.keywords))
              .sort((a, b) => getImplementationScore(b) - getImplementationScore(a))
              .slice(0, 6);
            return (
              <section key={comparison.slug}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">{comparison.title}</h2>
                    <p className="text-sm text-zinc-600 mt-1">{comparison.description}</p>
                  </div>
                  <Link href={`/search?q=${encodeURIComponent(comparison.keywords[0])}`} className="text-xs text-zinc-500 hover:text-zinc-900 shrink-0">
                    検索 →
                  </Link>
                </div>
                <div className="overflow-x-auto bg-white border border-zinc-200 mb-3">
                  <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50 text-xs text-zinc-500">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">候補</th>
                        <th className="text-left px-3 py-2 font-medium">実装</th>
                        <th className="text-left px-3 py-2 font-medium">難易度</th>
                        <th className="text-left px-3 py-2 font-medium">コスト</th>
                        <th className="text-left px-3 py-2 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matched.slice(0, 4).map((article) => (
                        <tr key={article.id} className="border-t border-zinc-100">
                          <td className="px-3 py-2 text-zinc-900">
                            <Link href={`/article/${encodeURIComponent(article.id)}`} className="hover:underline">
                              {article.title}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-zinc-600">{getImplementationStatus(article).join(" / ")}</td>
                          <td className="px-3 py-2 text-zinc-600">{estimateDifficulty(article).level}</td>
                          <td className="px-3 py-2 text-zinc-600">{estimateCost(article).level}</td>
                          <td className="px-3 py-2 text-zinc-600">{getImplementationScore(article)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {matched.slice(0, 3).map((article) => (
                    <ArticleCard key={article.id} article={article} categories={categories} compact />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
