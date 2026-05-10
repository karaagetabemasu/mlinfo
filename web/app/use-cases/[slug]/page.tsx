import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/app/components/Logo";
import SearchBar from "@/app/components/SearchBar";
import ArticleCard from "@/app/components/ArticleCard";
import { getArticles, getCategories } from "@/lib/data";
import { getImplementationScore } from "@/lib/articleInsights";
import { getTopicArticles, useCases } from "@/lib/topicCatalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return useCases.map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const useCase = useCases.find((item) => item.slug === slug);
  if (!useCase) return {};
  return {
    title: `${useCase.title}に使えるAI/機械学習技術`,
    description: useCase.description,
    alternates: {
      canonical: `https://mlinfo.vercel.app/use-cases/${useCase.slug}`,
    },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const useCase = useCases.find((item) => item.slug === slug);
  if (!useCase) notFound();

  const articles = getArticles();
  const categories = getCategories();
  const matched = getTopicArticles(useCase, articles);
  const easy = matched.filter((article) => getImplementationScore(article) >= 45).slice(0, 6);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-zinc-300">/</span>
          <span className="text-sm text-zinc-500">Use cases</span>
        </div>
        <SearchBar />
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <section className="mb-8">
          <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Use Case</p>
          <h1 className="text-2xl font-semibold text-zinc-950 mb-3">{useCase.title}に使えるAI/機械学習技術</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">{useCase.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {useCase.relatedTags.map((tag) => (
              <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="text-xs border border-zinc-200 bg-white px-2 py-1 text-zinc-600 hover:border-zinc-300">
                {tag}
              </Link>
            ))}
          </div>
        </section>

        {easy.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">実装しやすい候補</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {easy.map((article) => (
                <ArticleCard key={article.id} article={article} categories={categories} compact />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">関連記事</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {matched.slice(0, 16).map((article) => (
              <ArticleCard key={article.id} article={article} categories={categories} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
