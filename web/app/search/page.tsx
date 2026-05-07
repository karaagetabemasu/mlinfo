import { getArticles, getCategories } from "@/lib/data";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";
import Link from "next/link";
import ArticleCard from "@/app/components/ArticleCard";
import { getImplementationStatus } from "@/lib/articleInsights";

type Props = {
  searchParams: Promise<{ q?: string; implementation?: string; source?: string; difficulty?: string; cost?: string }>;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesQuery(article: {
  title: string;
  summary: string;
  summary_ja?: string;
  abstract_ja?: string;
  abstract?: string;
  use_case?: string;
  category?: string;
  subcategory?: string;
  tags?: { task: string[]; modality: string[]; learning: string[] };
}, query: string): boolean {
  const q = normalize(query);
  return [
    article.title,
    article.summary,
    article.summary_ja ?? "",
    article.abstract_ja ?? "",
    article.abstract ?? "",
    article.use_case ?? "",
    article.category ?? "",
    article.subcategory ?? "",
    ...(article.tags?.task ?? []),
    ...(article.tags?.modality ?? []),
    ...(article.tags?.learning ?? []),
  ]
    .some((f) => normalize(f).includes(q));
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", implementation = "all", source = "all" } = await searchParams;
  const articles = getArticles();
  const categories = getCategories();
  const queried = q ? articles.filter((a) => matchesQuery(a, q)) : [];
  const results = queried
    .filter((a) => source === "all" || a.source === source)
    .filter((a) => implementation === "all" || getImplementationStatus(a).some((status) => status !== "Paper only"));
  const filterHref = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set(key, value);
    if (key !== "source" && source !== "all") params.set("source", source);
    if (key !== "implementation" && implementation !== "all") params.set("implementation", implementation);
    return `/search?${params.toString()}`;
  };

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
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-zinc-600 text-xs">
              「<span className="text-zinc-900 font-medium">{q}</span>」の検索結果
            </p>
            <span className="text-zinc-400 text-xs">{results.length} 件</span>
          </div>
        )}

        {q && (
          <div className="mb-5 flex flex-wrap gap-2">
            {["all", "arxiv", "github", "huggingface"].map((value) => (
              <Link
                key={value}
                href={filterHref("source", value)}
                className={`text-xs px-2.5 py-1 border transition-colors ${
                  source === value ? "border-zinc-400 bg-white text-zinc-900" : "border-zinc-200 text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {value === "all" ? "すべて" : value}
              </Link>
            ))}
            <Link
              href={filterHref("implementation", implementation === "ready" ? "all" : "ready")}
              className={`text-xs px-2.5 py-1 border transition-colors ${
                implementation === "ready" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-500 hover:text-zinc-900"
              }`}
            >
              実装あり
            </Link>
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
          <div className="space-y-2">
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} categories={categories} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
