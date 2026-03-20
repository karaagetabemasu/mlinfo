import Link from "next/link";
import { getArticles, getCategories } from "@/lib/data";
import SearchBar from "@/app/components/SearchBar";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesQuery(article: { title: string; summary: string; abstract_ja?: string; abstract?: string }, query: string): boolean {
  const q = normalize(query);
  const fields = [
    article.title,
    article.summary,
    article.abstract_ja ?? "",
    article.abstract ?? "",
  ];
  return fields.some((f) => normalize(f).includes(q));
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const articles = getArticles();
  const categories = getCategories();

  const results = q ? articles.filter((a) => matchesQuery(a, q)) : [];

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white text-sm transition-colors">
            MLinfo
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm font-semibold">検索</span>
        </div>
      </header>

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <SearchBar initialQuery={q} />
        </div>

        {q && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-zinc-500 text-xs">
              「<span className="text-zinc-300">{q}</span>」の検索結果
            </p>
            <span className="text-zinc-600 text-xs">{results.length} 件</span>
          </div>
        )}

        {!q && (
          <p className="text-zinc-600 text-sm text-center py-16">
            キーワードを入力してください（日本語・英語どちらでも可）
          </p>
        )}

        {q && results.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-16">
            「{q}」に一致する記事が見つかりませんでした
          </p>
        )}

        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((article) => {
              const displaySummary = article.abstract_ja
                ? article.abstract_ja.slice(0, 120) + (article.abstract_ja.length > 120 ? "…" : "")
                : article.summary;
              return (
                <li key={article.id}>
                  <Link
                    href={`/article/${encodeURIComponent(article.id)}`}
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
                          <span className="text-zinc-600 text-xs border border-zinc-800 px-1.5 py-0.5 rounded">
                            {getCategoryName(article.category)}
                          </span>
                          <span className="text-zinc-700 text-xs">{article.publishedAt}</span>
                        </div>
                        <h3 className="font-medium text-sm leading-snug text-zinc-200 group-hover:text-white mb-1">
                          {article.title}
                        </h3>
                        <p className="text-zinc-500 text-xs leading-relaxed">{displaySummary}</p>
                      </div>
                      <span className="text-zinc-600 text-lg shrink-0 group-hover:text-zinc-400 transition-colors">→</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
