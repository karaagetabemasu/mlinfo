import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/app/components/Logo";
import SearchBar from "@/app/components/SearchBar";
import ArticleCard from "@/app/components/ArticleCard";
import { getArticles, getCategories } from "@/lib/data";
import { getImplementationScore } from "@/lib/articleInsights";
import { getTopicArticles, topics } from "@/lib/topicCatalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const topic = topics.find((item) => item.slug === slug);
  if (!topic) return {};
  return {
    title: `${topic.title}の論文・実装まとめ`,
    description: topic.description,
    alternates: {
      canonical: `https://mlinfo.vercel.app/topics/${topic.slug}`,
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = topics.find((item) => item.slug === slug);
  if (!topic) notFound();

  const articles = getArticles();
  const categories = getCategories();
  const topicArticles = getTopicArticles(topic, articles);
  const implementationPicks = topicArticles.slice(0, 6);
  const latestArticles = topicArticles.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 12);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-zinc-300">/</span>
          <Link href="/topics" className="text-sm text-zinc-500 hover:text-zinc-900">Topics</Link>
        </div>
        <SearchBar />
      </header>
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <section className="mb-8">
          <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Topic</p>
          <h1 className="text-2xl font-semibold text-zinc-950 mb-3">{topic.title}の論文・実装まとめ</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">{topic.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {topic.relatedTags.map((tag) => (
              <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="text-xs border border-zinc-200 bg-white px-2 py-1 text-zinc-600 hover:border-zinc-300">
                {tag}
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase">まず見るべき実装候補</h2>
            <span className="text-xs text-zinc-400">{topicArticles.length} articles</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {implementationPicks.map((article) => (
              <div key={article.id} className="relative">
                <div className="absolute right-3 top-3 z-10 text-xs border border-blue-100 bg-blue-50 px-2 py-0.5 text-blue-700">
                  Score {getImplementationScore(article)}
                </div>
                <ArticleCard article={article} categories={categories} compact />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">新着記事</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} categories={categories} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
