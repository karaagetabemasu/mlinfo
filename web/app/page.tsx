import Link from "next/link";
import { getArticles, getCategories, getLastUpdated } from "@/lib/data";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";
import ArticleCard from "@/app/components/ArticleCard";
import AdSlot from "@/app/components/AdSlot";
import { getImplementationScore, getImplementationStatus, isMaterialsInformatics } from "@/lib/articleInsights";
import { topics, useCases } from "@/lib/topicCatalog";

export default function Home() {
  const categories = getCategories();
  const articles = getArticles();
  const lastUpdated = getLastUpdated();
  const totalArticles = articles.length || categories.flatMap((c) => c.subcategories).reduce((sum, s) => sum + s.articleCount, 0);
  const totalCategories = categories.length;

  const trendingPapers = articles
    .filter((a) => a.source !== "github" && (a.likes_count ?? 0) > 0)
    .sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
    .slice(0, 5);

  const trendingRepos = articles
    .filter((a) => a.source === "github")
    .sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
    .slice(0, 3);
  const latestArticles = articles.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 8);
  const implementationReady = articles
    .filter((a) => getImplementationStatus(a).some((status) => status !== "Paper only"))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 4);
  const implementationPicks = articles
    .slice()
    .sort((a, b) => getImplementationScore(b) - getImplementationScore(a))
    .slice(0, 6);
  const huggingFaceArticles = articles.filter((a) => a.source === "huggingface").slice(0, 4);
  const materialsArticles = articles.filter(isMaterialsInformatics).slice(0, 4);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-8 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-3 text-xs text-zinc-500">
            <Link href="/weekly" className="hover:text-zinc-900">週次まとめ</Link>
            <Link href="/topics" className="hover:text-zinc-900">トピック</Link>
            <Link href="/compare" className="hover:text-zinc-900">比較</Link>
            <Link href="/saved" className="hover:text-zinc-900">保存</Link>
          </nav>
          <SearchBar />
          <div className="flex items-center gap-2 text-xs text-zinc-400 hidden sm:flex">
            <span>{totalCategories} categories</span>
            <span className="text-zinc-300">·</span>
            <span>{totalArticles} articles</span>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <section className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Implementation Dashboard</p>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 mb-2">
                AI/機械学習技術を実装・検証するための入口
              </h1>
              <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
                論文、GitHub、Hugging Faceを横断し、用途、実装可否、難易度、推論コストの目安から短時間で読むべき技術を選べます。
              </p>
            </div>
            {lastUpdated && (
              <span className="text-zinc-400 text-xs shrink-0">最終更新: {lastUpdated.slice(0, 10)}</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
            <Link href="/search?q=github" className="bg-white border border-zinc-200 p-3 hover:border-zinc-300 transition-colors">
              <span className="block text-xs text-zinc-400">GitHubあり</span>
              <span className="text-lg font-semibold text-zinc-900">{articles.filter((a) => a.source === "github" || a.codeUrl || a.hasCode).length}</span>
            </Link>
            <Link href="/search?q=huggingface" className="bg-white border border-zinc-200 p-3 hover:border-zinc-300 transition-colors">
              <span className="block text-xs text-zinc-400">Hugging Face</span>
              <span className="text-lg font-semibold text-zinc-900">{articles.filter((a) => a.source === "huggingface").length}</span>
            </Link>
            <Link href="/category/nlp" className="bg-white border border-zinc-200 p-3 hover:border-zinc-300 transition-colors">
              <span className="block text-xs text-zinc-400">RAG / LLM</span>
              <span className="text-lg font-semibold text-zinc-900">{articles.filter((a) => a.category === "nlp").length}</span>
            </Link>
            <Link href="/search?q=materials" className="bg-white border border-zinc-200 p-3 hover:border-zinc-300 transition-colors">
              <span className="block text-xs text-zinc-400">Materials候補</span>
              <span className="text-lg font-semibold text-zinc-900">{materialsArticles.length}</span>
            </Link>
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase">今日の実装注目</h2>
            <Link href="/weekly" className="text-xs text-zinc-500 hover:text-zinc-900">週次まとめ →</Link>
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

        <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs tracking-widest text-zinc-400 uppercase">トピックから探す</h2>
              <Link href="/topics" className="text-xs text-zinc-500 hover:text-zinc-900">一覧 →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topics.slice(0, 6).map((topic) => (
                <Link key={topic.slug} href={`/topics/${topic.slug}`} className="bg-white border border-zinc-200 p-3 hover:border-zinc-300 transition-colors">
                  <span className="block text-sm font-semibold text-zinc-900">{topic.title}</span>
                  <span className="block text-xs text-zinc-500 mt-1 leading-relaxed">{topic.description}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs tracking-widest text-zinc-400 uppercase">用途から探す</h2>
              <Link href="/use-cases/document-search" className="text-xs text-zinc-500 hover:text-zinc-900">用途ページ →</Link>
            </div>
            <div className="space-y-2">
              {useCases.map((useCase) => (
                <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`} className="block bg-white border border-zinc-200 p-3 hover:border-zinc-300 transition-colors">
                  <span className="block text-sm font-semibold text-zinc-900">{useCase.title}</span>
                  <span className="block text-xs text-zinc-500 mt-1 leading-relaxed">{useCase.description}</span>
                </Link>
              ))}
              <Link href="/saved" className="block bg-zinc-900 border border-zinc-900 p-3 text-white hover:bg-zinc-700 transition-colors">
                <span className="block text-sm font-semibold">保存した記事を見る</span>
                <span className="block text-xs text-zinc-300 mt-1">あとで実装・比較したい記事をブックマークから再開できます。</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase">新着・実装判断カード</h2>
            <Link href="/search" className="text-xs text-zinc-500 hover:text-zinc-900">検索ページへ →</Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} categories={categories} />
            ))}
          </div>
        </section>

        {implementationReady.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">実装ありの記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {implementationReady.map((article) => (
                <ArticleCard key={article.id} article={article} categories={categories} compact />
              ))}
            </div>
          </section>
        )}

        <AdSlot label="記事一覧内広告枠" className="mb-10" />

        {(huggingFaceArticles.length > 0 || materialsArticles.length > 0) && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {huggingFaceArticles.length > 0 && (
              <div>
                <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">Hugging Faceあり</h2>
                <div className="space-y-2">
                  {huggingFaceArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} categories={categories} compact />
                  ))}
                </div>
              </div>
            )}
            {materialsArticles.length > 0 && (
              <div>
                <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">Materials Informatics関連</h2>
                <div className="space-y-2">
                  {materialsArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} categories={categories} compact />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 注目論文ランキング */}
        {trendingPapers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">注目論文</h2>
            <ol className="space-y-2">
              {trendingPapers.map((article, i) => (
                <li key={article.id}>
                  <Link
                    href={`/article/${encodeURIComponent(article.id)}`}
                    className="flex items-start gap-4 bg-white border border-zinc-200 px-4 py-3 hover:bg-zinc-50 hover:border-zinc-300 transition-all group"
                  >
                    <span className="text-zinc-300 font-mono text-sm w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                          article.source === "huggingface" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
                        }`}>
                          {article.source}
                        </span>
                        <span className="text-xs text-zinc-400">▲ {article.likes_count}</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-900 truncate">{article.title}</p>
                      {article.use_case && (
                        <p className="text-xs text-blue-600 truncate mt-0.5">→ {article.use_case}</p>
                      )}
                    </div>
                    <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 人気リポジトリ */}
        {trendingRepos.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-4">人気リポジトリ</h2>
            <ol className="space-y-2">
              {trendingRepos.map((article, i) => (
                <li key={article.id}>
                  <Link
                    href={`/article/${encodeURIComponent(article.id)}`}
                    className="flex items-start gap-4 bg-white border border-zinc-200 px-4 py-3 hover:bg-zinc-50 hover:border-zinc-300 transition-all group"
                  >
                    <span className="text-zinc-300 font-mono text-sm w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-zinc-100 text-zinc-600">github</span>
                        <span className="text-xs text-zinc-400">★ {article.likes_count}</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-900 truncate">{article.title}</p>
                    </div>
                    <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs tracking-widest text-zinc-400 uppercase">Categories</h2>
          {lastUpdated && (
            <span className="text-zinc-400 text-xs">最終更新: {lastUpdated.slice(0, 10)}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category) => {
            const catArticles = articles.filter((a) => a.category === category.id);
            const subCounts = catArticles.reduce((acc, a) => {
              acc[a.subcategory] = (acc[a.subcategory] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const topSubs = category.subcategories
              .map((s) => ({ ...s, articleCount: subCounts[s.id] ?? 0 }))
              .filter((s) => s.articleCount > 0)
              .slice(0, 4);
            return (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className={`border-l-2 ${category.color} border border-zinc-200 border-l-0 bg-white p-5 hover:bg-zinc-50 hover:border-zinc-300 transition-all group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-zinc-900 text-sm">{category.name}</h3>
                  <span className="text-zinc-500 text-xs font-mono">{catArticles.length}</span>
                </div>
                <ul className="space-y-1.5 mb-3">
                  {topSubs.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between">
                      <span className="text-zinc-600 text-xs">{sub.name}</span>
                      <span className="text-zinc-500 text-xs font-mono">{sub.articleCount}</span>
                    </li>
                  ))}
                </ul>
                {Object.keys(subCounts).length > 4 && (
                  <p className="text-zinc-400 text-xs">
                    他 {Object.keys(subCounts).length - 4} サブカテゴリ →
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
