import Link from "next/link";
import Logo from "@/app/components/Logo";
import SearchBar from "@/app/components/SearchBar";
import { getArticles } from "@/lib/data";
import { getTopicArticles, topics } from "@/lib/topicCatalog";

export const metadata = {
  title: "AI/機械学習トピック一覧",
  description: "RAG、LLM fine-tuning、Materials Informatics、ベイズ最適化、センサデータ分析など、実装者向けのAI/機械学習トピック一覧。",
};

export default function TopicsPage() {
  const articles = getArticles();

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <Logo />
        <SearchBar />
      </header>
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Topics</p>
        <h1 className="text-2xl font-semibold text-zinc-950 mb-3">AI/機械学習トピック一覧</h1>
        <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl mb-6">
          実装者が調べる頻度の高い技術領域を、論文・GitHub・Hugging Faceを横断して整理しています。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map((topic) => {
            const count = getTopicArticles(topic, articles).length;
            return (
              <Link key={topic.slug} href={`/topics/${topic.slug}`} className="bg-white border border-zinc-200 p-5 hover:border-zinc-300 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-base font-semibold text-zinc-900">{topic.title}</h2>
                  <span className="text-xs font-mono text-zinc-400">{count}</span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">{topic.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {topic.relatedTags.map((tag) => (
                    <span key={tag} className="text-xs border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-zinc-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
