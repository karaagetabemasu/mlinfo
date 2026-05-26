import Link from "next/link";
import Logo from "@/app/components/Logo";
import SearchBar from "@/app/components/SearchBar";
import ArticleCard from "@/app/components/ArticleCard";
import { getArticles, getCategories } from "@/lib/data";
import { getManufacturingFitScore, isManufacturingRelevant } from "@/lib/articleInsights";
import { manufacturingGuides, getManufacturingGuideArticles } from "@/lib/manufacturingCatalog";

export const metadata = {
  title: "製造業・材料開発のためのAI/MI内製化ナビ",
  description: "配合最適化、品質予測、異常検知、材料探索、画像検査など、製造業・材料開発チームがAI/MIを自社データで試すための実装ガイド。",
  alternates: {
    canonical: "https://mlinfo.vercel.app/manufacturing-ai",
  },
};

export default function ManufacturingAiPage() {
  const articles = getArticles();
  const categories = getCategories();
  const picks = articles
    .filter(isManufacturingRelevant)
    .sort((a, b) => getManufacturingFitScore(b) - getManufacturingFitScore(a) || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 12);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-8 py-4 flex items-center justify-between">
        <Logo />
        <SearchBar />
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <section className="mb-8">
          <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Manufacturing AI / Materials Informatics</p>
          <h1 className="text-2xl font-semibold text-zinc-950 mb-3">製造業・材料開発のためのAI/MI内製化ナビ</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">
            論文やGitHubを探すだけでなく、配合最適化、品質予測、異常検知、材料探索を自社のExcel/CSVデータで試す最初の一歩まで整理します。
          </p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-zinc-200 p-4">
              <h2 className="text-sm font-semibold text-zinc-900 mb-2">少数データから始める</h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                製造業や材料開発では実験数が限られます。LightGBM、Gaussian Process、ベイズ最適化など、nが小さい段階でも試しやすい手法を優先します。
              </p>
            </div>
            <div className="bg-white border border-zinc-200 p-4">
              <h2 className="text-sm font-semibold text-zinc-900 mb-2">Excel/CSVを前提にする</h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                1行1実験、1行1ロットの表形式データを出発点にして、品質予測、配合最適化、異常検知へつなげます。
              </p>
            </div>
            <div className="bg-white border border-zinc-200 p-4">
              <h2 className="text-sm font-semibold text-zinc-900 mb-2">説明できるAIを重視する</h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                精度だけでなく、SHAPや特徴量重要度で現場・上司・研究チームに説明できることを重視します。
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">問題から始める</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {manufacturingGuides.map((guide) => {
              const count = getManufacturingGuideArticles(guide, articles).length;
              return (
                <Link key={guide.slug} href={`/manufacturing-ai/${guide.slug}`} className="bg-white border border-zinc-200 p-5 hover:border-zinc-300 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-base font-semibold text-zinc-900">{guide.title}</h2>
                    <span className="text-xs font-mono text-zinc-400">{count}</span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">{guide.description}</p>
                  <p className="text-xs text-cyan-700 mt-3">{guide.baseline}から始める →</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase">製造業MI向け注目記事</h2>
            <span className="text-xs text-zinc-400">{picks.length} picks</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {picks.map((article) => (
              <ArticleCard key={article.id} article={article} categories={categories} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
