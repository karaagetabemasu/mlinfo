import { notFound } from "next/navigation";
import { getArticles, getCategories } from "@/lib/data";
import ArticleListWithFilter from "@/app/components/ArticleListWithFilter";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";
import ArticleCard from "@/app/components/ArticleCard";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "machine-learning": "表形式データ、時系列、異常検知、特徴量設計など、実務の検証に直結しやすい機械学習技術を扱います。",
  "deep-learning": "Transformer、GNN、軽量化など、モデル実装や既存モデル改良に関係する深層学習技術を追います。",
  nlp: "LLM、RAG、埋め込み、ファインチューニングなど、AIアプリ実装に必要な自然言語処理技術を整理します。",
  "computer-vision": "画像分類、検出、セグメンテーション、動画認識など、視覚AIの実装と評価に関係する技術群です。",
  "generative-ai": "Diffusion、画像生成、動画生成など、生成モデルの実装可否と推論コストを重視して整理します。",
  "reinforcement-learning": "PPO、モデルベースRL、RLHFなど、制御・最適化・エージェント設計に関係する技術を扱います。",
  mlops: "実験管理、デプロイ、監視、データ管理など、機械学習システムを運用するための技術カテゴリです。",
  "math-theory": "最適化、確率統計、解釈可能性など、手法選定や評価設計の土台になる理論を扱います。",
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getCategories().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const category = getCategories().find((c) => c.id === id);
  if (!category) return {};
  const count = getArticles().filter((a) => a.category === id).length;
  const description = `${category.name}に関する機械学習・AI論文を${count}件収録。arXiv・GitHub・HuggingFaceから毎日更新。`;
  return {
    title: category.name,
    description,
    openGraph: {
      title: `${category.name} | MLinfo`,
      description,
      type: "website",
      url: `https://mlinfo.vercel.app/category/${id}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  const categories = getCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const categoryArticles = getArticles().filter((a) => a.category === id);
  const popularArticles = categoryArticles.slice().sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)).slice(0, 3);
  const latestArticles = categoryArticles.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3);
  const subcategoryNameMap = Object.fromEntries(
    category.subcategories.map((s) => [s.id, s.name])
  );

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-zinc-300">/</span>
          <h1 className="text-sm font-semibold text-zinc-900">{category.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar />
          <span className="text-zinc-400 text-xs">{categoryArticles.length} articles</span>
        </div>
      </header>

      <section className="border-b border-zinc-200 bg-white px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Category</p>
          <h2 className="text-xl font-semibold text-zinc-950 mb-2">{category.name}</h2>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">
            {CATEGORY_DESCRIPTIONS[category.id] ?? `${category.name}に関するAI/機械学習技術を、実装可否や用途から探せます。`}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {category.subcategories.slice(0, 10).map((sub) => (
              <span key={sub.id} className="text-xs border border-zinc-200 bg-zinc-50 text-zinc-600 px-2 py-1">
                {sub.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {(popularArticles.length > 0 || latestArticles.length > 0) && (
        <section className="px-6 py-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      )}

      <ArticleListWithFilter articles={categoryArticles} category={category} subcategoryNameMap={subcategoryNameMap} />
    </main>
  );
}
