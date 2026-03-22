import { getArticles, getCategories } from "@/lib/data";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesQuery(article: { title: string; summary: string; abstract_ja?: string; abstract?: string }, query: string): boolean {
  const q = normalize(query);
  return [article.title, article.summary, article.abstract_ja ?? "", article.abstract ?? ""]
    .some((f) => normalize(f).includes(q));
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const articles = getArticles();
  const categories = getCategories();
  const results = q ? articles.filter((a) => matchesQuery(a, q)) : [];
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-semibold text-zinc-700">検索</span>
        </div>
      </header>

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <SearchBar initialQuery={q} />
        </div>

        {q && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-zinc-600 text-xs">
              「<span className="text-zinc-900 font-medium">{q}</span>」の検索結果
            </p>
            <span className="text-zinc-400 text-xs">{results.length} 件</span>
          </div>
        )}

        {!q && (
          <p className="text-zinc-400 text-sm text-center py-16">
            キーワードを入力してください（日本語・英語どちらでも可）
          </p>
        )}

        {q && results.length === 0 && (
          <p className="text-zinc-400 text-sm text-center py-16">
            「{q}」に一致する記事が見つかりませんでした
          </p>
        )}

        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/article/${encodeURIComponent(article.id)}`}
                  className="block bg-white border border-zinc-200 p-4 hover:bg-zinc-50 hover:border-zinc-300 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                          article.source === "arxiv" ? "bg-violet-100 text-violet-700"
                          : article.source === "zenn" ? "bg-sky-100 text-sky-700"
                          : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {article.source}
                        </span>
                        <span className="text-xs bg-zinc-100 border border-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded">
                          {getCategoryName(article.category)}
                        </span>
                        <span className="text-zinc-400 text-xs">{article.publishedAt}</span>
                      </div>
                      <h3 className="font-semibold text-sm leading-snug text-zinc-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-zinc-700 text-xs leading-relaxed">{article.summary}</p>
                    </div>
                    <span className="text-zinc-300 text-lg shrink-0 group-hover:text-zinc-500 transition-colors">→</span>
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
