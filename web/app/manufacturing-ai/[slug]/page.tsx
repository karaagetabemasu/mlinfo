import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/app/components/Logo";
import SearchBar from "@/app/components/SearchBar";
import ArticleCard from "@/app/components/ArticleCard";
import { getArticles, getCategories } from "@/lib/data";
import { getManufacturingFitScore } from "@/lib/articleInsights";
import { getManufacturingGuideArticles, manufacturingGuides } from "@/lib/manufacturingCatalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return manufacturingGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = manufacturingGuides.find((item) => item.slug === slug);
  if (!guide) return {};
  return {
    title: `${guide.title}のAI/MI実装ガイド`,
    description: guide.description,
    alternates: {
      canonical: `https://mlinfo.vercel.app/manufacturing-ai/${guide.slug}`,
    },
  };
}

export default async function ManufacturingGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = manufacturingGuides.find((item) => item.slug === slug);
  if (!guide) notFound();

  const articles = getArticles();
  const categories = getCategories();
  const matched = getManufacturingGuideArticles(guide, articles);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-zinc-300">/</span>
          <Link href="/manufacturing-ai" className="text-sm text-zinc-500 hover:text-zinc-900">製造業AI</Link>
        </div>
        <SearchBar />
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <section className="mb-8">
          <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Internalization Guide</p>
          <h1 className="text-2xl font-semibold text-zinc-950 mb-3">{guide.title}のAI/MI実装ガイド</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">{guide.description}</p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 mb-10">
          <div className="bg-white border border-zinc-200 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">実装の始め方</h2>
            <ol className="space-y-3 text-sm text-zinc-700">
              {guide.firstSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="text-xs font-mono text-zinc-400 w-5 shrink-0">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="space-y-3">
            <div className="bg-white border border-zinc-200 p-4">
              <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">PoC設計</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-zinc-400">対象課題</dt>
                  <dd className="text-zinc-800">{guide.problem}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">入力データ</dt>
                  <dd className="text-zinc-800">{guide.dataShape}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">最初のベースライン</dt>
                  <dd className="text-zinc-800">{guide.baseline}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">評価指標</dt>
                  <dd className="text-zinc-800">{guide.evaluation}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>

        <section className="mb-10">
          <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">おすすめ手法</h2>
          <div className="flex flex-wrap gap-2">
            {guide.recommendedMethods.map((method) => (
              <Link key={method} href={`/search?q=${encodeURIComponent(method)}`} className="text-xs border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 hover:border-zinc-300">
                {method}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase">関連する論文・実装</h2>
            <span className="text-xs text-zinc-400">{matched.length} articles</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {matched.slice(0, 16).map((article) => (
              <div key={article.id} className="relative">
                <div className="absolute right-3 top-3 z-10 text-xs border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-cyan-700">
                  製造業 {getManufacturingFitScore(article)}
                </div>
                <ArticleCard article={article} categories={categories} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
