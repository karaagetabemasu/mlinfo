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
import { TASK_TAG_LABELS, MODALITY_TAG_LABELS, LEARNING_TAG_LABELS } from "@/app/data/dummy";

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
    ? `${article.use_case} — ${(article.summary_ja || article.summary).slice(0, 100)}...`
    : (article.summary_ja || article.summary).slice(0, 120);
  const title = article.use_case
    ? `${article.title}【${article.use_case}】`
    : article.title;
  const arxivId = article.source === "arxiv" ? id.replace("arxiv-", "") : null;
  const keywords = [
    ...(article.authors ?? []),
    article.category,
    article.subcategory,
    "機械学習",
    "arxiv",
    ...(arxivId ? [arxivId] : []),
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
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
  const article = getArticles().find((a) => a.id === id);
  if (!article) notFound();

  const category = getCategories().find((c) => c.id === article.category);

  const codeRef = article.source === "github"
    ? article.url
    : article.codeUrl ?? null;

  const implementPrompt = [
    `# 論文・記事`,
    article.title,
    ``,
    `# 解決する問題`,
    article.use_case || article.summary_ja || article.summary,
    ``,
    `# 概要`,
    article.summary_ja || article.summary,
    ...(codeRef ? [``, `# 参考コード`, codeRef] : []),
    ``,
    `上記の論文・記事の手法を実装してください。`,
  ].join("\n");

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <MarkAsRead id={article.id} />
      <header className="border-b border-zinc-200 bg-white px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo />
          {category && (
            <>
              <span className="text-zinc-300">/</span>
              <Link
                href={`/category/${category.id}`}
                className="text-zinc-400 hover:text-zinc-900 text-sm transition-colors"
              >
                {category.name}
              </Link>
            </>
          )}
        </div>
        <SearchBar />
      </header>

      <div className="px-8 py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${
              article.source === "arxiv"
                ? "bg-violet-100 text-violet-700"
                : article.source === "huggingface"
                ? "bg-amber-100 text-amber-700"
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
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 mb-3">
              <span className="text-xs text-blue-400">解決する問題</span>
              <span className="text-xs font-medium text-blue-700">{article.use_case}</span>
            </div>
          )}
          <AbstractSection
            abstract={article.abstract ?? article.summary}
            summary_ja={article.summary_ja}
          />

          {/* Tags (FR-01) */}
          {article.tags && (article.tags.task.length > 0 || article.tags.modality.length > 0 || article.tags.learning.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {article.tags.task.map((tag) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5">
                  {TASK_TAG_LABELS[tag] ?? tag}
                </span>
              ))}
              {article.tags.modality.map((tag) => (
                <span key={tag} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5">
                  {MODALITY_TAG_LABELS[tag] ?? tag}
                </span>
              ))}
              {article.tags.learning.map((tag) => (
                <span key={tag} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5">
                  {LEARNING_TAG_LABELS[tag] ?? tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {article.source === "github" ? "リポジトリを開く →" : "論文・記事を開く →"}
          </a>
          {article.codeUrl && article.source !== "github" && (
            <a
              href={article.codeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Official Code →
            </a>
          )}
          {!article.hasCode && article.source !== "github" && (
            <span className="text-xs border border-zinc-200 px-4 py-2 text-zinc-400">
              実装なし
            </span>
          )}
          <CopyUrlButton />
          <CopyPromptButton prompt={implementPrompt} />
          {codeRef && (
            <a
              href={codeRef.replace("github.com", "github.dev")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-colors"
            >
              github.dev で開く →
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
