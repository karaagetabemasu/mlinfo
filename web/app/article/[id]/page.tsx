import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles, getCategories } from "@/lib/data";
import AbstractSection from "@/app/components/AbstractSection";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";
import CopyUrlButton from "@/app/components/CopyUrlButton";
import CopyPromptButton from "@/app/components/CopyPromptButton";
import MarkAsRead from "@/app/components/MarkAsRead";
import BookmarkButton from "@/app/components/BookmarkButton";
import TrackedExternalLink from "@/app/components/TrackedExternalLink";
import ScrollDepthTracker from "@/app/components/ScrollDepthTracker";
import ArticleCard from "@/app/components/ArticleCard";
import AdSlot from "@/app/components/AdSlot";
import TrackedTagLink from "@/app/components/TrackedTagLink";
import { LEARNING_TAG_LABELS, MODALITY_TAG_LABELS, TASK_TAG_LABELS } from "@/app/data/dummy";
import {
  estimateCost,
  estimateDifficulty,
  getFieldTags,
  getRelatedArticles,
  getResourceLinks,
  getShortDescription,
  getUseCase,
} from "@/lib/articleInsights";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getArticles().map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const article = getArticles().find((a) => a.id === id);
  if (!article) return {};
  const description = article.use_case
    ? `${article.use_case} - ${(article.summary_ja || article.summary).slice(0, 100)}...`
    : (article.summary_ja || article.summary).slice(0, 120);
  const title = article.use_case ? `${article.title}【${article.use_case}】` : article.title;
  const arxivId = article.source === "arxiv" ? id.replace("arxiv-", "") : null;
  const keywords = [
    ...(article.authors ?? []),
    article.category,
    article.subcategory,
    "機械学習",
    "実装",
    "AI論文",
    ...(arxivId ? [arxivId] : []),
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://mlinfo.vercel.app/article/${id}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://mlinfo.vercel.app/article/${id}`,
      siteName: "MLinfo",
      ...(article.authors?.length ? { authors: article.authors } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const articles = getArticles();
  const categories = getCategories();
  const article = articles.find((a) => a.id === id);
  if (!article) notFound();

  const category = categories.find((c) => c.id === article.category);
  const codeRef = article.source === "github" ? article.url : article.codeUrl ?? null;
  const relatedArticles = getRelatedArticles(article, articles, 4);
  const resourceLinks = getResourceLinks(article);
  const difficulty = estimateDifficulty(article);
  const cost = estimateCost(article);
  const fieldTags = getFieldTags(article, categories);
  const description = getShortDescription(article);

  const implementPrompt = [
    "# 論文・記事",
    article.title,
    "",
    "# 解決する問題",
    article.use_case || article.summary_ja || article.summary,
    "",
    "# 概要",
    article.summary_ja || article.summary,
    ...(codeRef ? ["", "# 参考コード", codeRef] : []),
    "",
    "上記の論文・記事の手法を実装してください。",
  ].join("\n");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "MLinfo", item: "https://mlinfo.vercel.app/" },
      ...(category
        ? [{ "@type": "ListItem", position: 2, name: category.name, item: `https://mlinfo.vercel.app/category/${category.id}` }]
        : []),
      { "@type": "ListItem", position: category ? 3 : 2, name: article.title, item: `https://mlinfo.vercel.app/article/${article.id}` },
    ],
  };
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: (article.authors ?? []).map((name) => ({ "@type": "Person", name })),
    mainEntityOfPage: `https://mlinfo.vercel.app/article/${article.id}`,
    keywords: fieldTags.join(", "),
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <MarkAsRead id={article.id} />
      <ScrollDepthTracker articleId={article.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <header className="border-b border-zinc-200 bg-white px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo />
          {category && (
            <>
              <span className="text-zinc-300">/</span>
              <Link href={`/category/${category.id}`} className="text-zinc-400 hover:text-zinc-900 text-sm transition-colors">
                {category.name}
              </Link>
            </>
          )}
        </div>
        <SearchBar />
      </header>

      <div className="px-8 py-4 max-w-5xl mx-auto">
        <nav className="text-xs text-zinc-400 flex items-center gap-2 mb-4">
          <Link href="/" className="hover:text-zinc-900">Home</Link>
          {category && (
            <>
              <span>/</span>
              <Link href={`/category/${category.id}`} className="hover:text-zinc-900">{category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-zinc-500 truncate">{article.title}</span>
        </nav>
      </div>

      <div className="px-8 pb-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8">
        <article>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                article.source === "arxiv" ? "bg-violet-100 text-violet-700"
                : article.source === "huggingface" ? "bg-amber-100 text-amber-700"
                : "bg-zinc-100 text-zinc-600"
              }`}>
                {article.source}
              </span>
              <span className="text-zinc-400 text-xs">{article.publishedAt}</span>
              {article.source === "arxiv" && (
                <span className="text-zinc-400 text-xs font-mono">arXiv:{article.id.replace("arxiv-", "")}</span>
              )}
            </div>

            <div className="flex items-start gap-3 mb-3">
              <h1 className="text-xl font-semibold text-zinc-900 flex-1">{article.title}</h1>
              <BookmarkButton id={article.id} />
            </div>

            {article.authors && article.authors.length > 0 && (
              <p className="text-xs text-zinc-400 mb-3">{article.authors.join(", ")}</p>
            )}

            {article.use_case && (
              <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 mb-4">
                <span className="text-xs text-blue-400">解決する問題</span>
                <span className="text-xs font-medium text-blue-700">{article.use_case}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <div className="border border-zinc-200 bg-white px-3 py-2">
                <p className="text-xs text-zinc-400">実装難易度</p>
                <p className="text-sm font-semibold text-zinc-900">{difficulty.level}</p>
              </div>
              <div className="border border-zinc-200 bg-white px-3 py-2">
                <p className="text-xs text-zinc-400">推論・学習コスト</p>
                <p className="text-sm font-semibold text-zinc-900">{cost.level}</p>
              </div>
              <div className="border border-zinc-200 bg-white px-3 py-2">
                <p className="text-xs text-zinc-400">想定用途</p>
                <p className="text-sm font-semibold text-zinc-900 truncate">{getUseCase(article)}</p>
              </div>
            </div>

            {article.tags && (article.tags.task.length > 0 || article.tags.modality.length > 0 || article.tags.learning.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {article.tags.task.map((tag) => (
                  <TrackedTagLink key={tag} href={`/search?q=${encodeURIComponent(tag)}`} tag={tag} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5">
                    {TASK_TAG_LABELS[tag] ?? tag}
                  </TrackedTagLink>
                ))}
                {article.tags.modality.map((tag) => (
                  <TrackedTagLink key={tag} href={`/search?q=${encodeURIComponent(tag)}`} tag={tag} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5">
                    {MODALITY_TAG_LABELS[tag] ?? tag}
                  </TrackedTagLink>
                ))}
                {article.tags.learning.map((tag) => (
                  <TrackedTagLink key={tag} href={`/search?q=${encodeURIComponent(tag)}`} tag={tag} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5">
                    {LEARNING_TAG_LABELS[tag] ?? tag}
                  </TrackedTagLink>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-8 flex-wrap">
            {resourceLinks.map((link) => (
              <TrackedExternalLink
                key={`${link.kind}:${link.url}`}
                href={link.url}
                kind={link.kind}
                articleId={article.id}
                className="text-xs border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {link.label} →
              </TrackedExternalLink>
            ))}
            {!article.hasCode && article.source !== "github" && (
              <span className="text-xs border border-zinc-200 px-4 py-2 text-zinc-400">実装なし</span>
            )}
            <CopyUrlButton />
            <CopyPromptButton prompt={implementPrompt} />
            {codeRef && (
              <TrackedExternalLink
                href={codeRef.replace("github.com", "github.dev")}
                kind="github"
                articleId={article.id}
                className="text-xs border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-colors"
              >
                github.dev で開く →
              </TrackedExternalLink>
            )}
          </div>

          <section className="space-y-6">
            <section className="bg-white border border-zinc-200 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">概要</h2>
              <AbstractSection abstract={article.abstract ?? article.summary} summary_ja={article.summary_ja} />
            </section>

            <section className="bg-white border border-zinc-200 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">何が新しいか</h2>
              <p className="text-sm leading-relaxed text-zinc-700">{article.summary_ja || article.summary}</p>
            </section>

            <section className="bg-white border border-zinc-200 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">何に使えるか</h2>
              <p className="text-sm leading-relaxed text-zinc-700">{getUseCase(article)}</p>
            </section>

            <section className="bg-white border border-zinc-200 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">実装情報</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-zinc-400">Paper URL</dt>
                  <dd className="text-zinc-700">{article.source === "arxiv" ? "あり" : "未取得"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">GitHub URL</dt>
                  <dd className="text-zinc-700">{article.source === "github" || article.codeUrl ? "あり" : "未取得"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">Hugging Face URL</dt>
                  <dd className="text-zinc-700">{article.source === "huggingface" ? "あり" : "未取得"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">Demo / Colab</dt>
                  <dd className="text-zinc-700">未取得</dd>
                </div>
              </dl>
            </section>

            <section className="bg-white border border-zinc-200 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">実装難易度</h2>
              <p className="text-sm text-zinc-700"><span className="font-semibold">{difficulty.level}</span> - {difficulty.reason}</p>
            </section>

            <section className="bg-white border border-zinc-200 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">必要リソース</h2>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li>GPU目安: {cost.level}</li>
                <li>データセット: 論文・リポジトリ側の指定を確認してください。</li>
                <li>学習要否: {difficulty.level === "Easy" ? "推論だけで試せる可能性があります。" : "再学習や評価環境の準備が必要になる可能性があります。"}</li>
                <li>{cost.note}</li>
              </ul>
            </section>

            <section className="bg-white border border-zinc-200 p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">実務で使う場合の注意点</h2>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li>ライセンスと商用利用条件は、Paper / GitHub / Hugging Face の配布元で確認してください。</li>
                <li>精度、再現性、計算コストはデータセットや評価条件に依存します。</li>
                <li>個人情報や機密データを扱う場合は、入力データの保存先と外部API利用条件を確認してください。</li>
              </ul>
            </section>

            <AdSlot label="関連記事前広告枠" />

            {relatedArticles.length > 0 && (
              <section>
                <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">関連記事</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {relatedArticles.map((related) => (
                    <ArticleCard key={related.id} article={related} categories={categories} compact onClickEvent="related_article_click" />
                  ))}
                </div>
              </section>
            )}
          </section>
        </article>

        <aside className="space-y-4">
          <div className="bg-white border border-zinc-200 p-4 sticky top-4">
            <h2 className="text-xs tracking-widest text-zinc-400 uppercase mb-3">実装判断</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-zinc-400">難易度</dt>
                <dd className="font-semibold text-zinc-900">{difficulty.level}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">コスト</dt>
                <dd className="font-semibold text-zinc-900">{cost.level}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">分野</dt>
                <dd className="text-zinc-700">{fieldTags.slice(0, 3).join(" / ")}</dd>
              </div>
            </dl>
          </div>
          <AdSlot label="サイドバー広告枠" />
        </aside>
      </div>
    </main>
  );
}
