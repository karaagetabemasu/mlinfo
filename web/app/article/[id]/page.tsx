import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles, getCategories } from "@/lib/data";
import AbstractSection from "@/app/components/AbstractSection";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";
import CopyUrlButton from "@/app/components/CopyUrlButton";
import MarkAsRead from "@/app/components/MarkAsRead";
import BookmarkButton from "@/app/components/BookmarkButton";
import { TASK_TAG_LABELS, MODALITY_TAG_LABELS, LEARNING_TAG_LABELS } from "@/app/data/dummy";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const article = getArticles().find((a) => a.id === id);
  if (!article) return {};
  const description = article.use_case
    ? `${article.use_case} — ${article.summary.slice(0, 100)}...`
    : article.summary.slice(0, 120);
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: `https://mlinfo.vercel.app/article/${id}`,
      siteName: "MLinfo",
    },
    twitter: {
      card: "summary",
      title: article.title,
      description,
    },
  };
}

const DUMMY_CODE = `import torch
import torch.nn as nn

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int):
        super().__init__()
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, C = x.shape
        q = self.W_q(x).view(B, T, self.num_heads, self.d_k).transpose(1, 2)
        k = self.W_k(x).view(B, T, self.num_heads, self.d_k).transpose(1, 2)
        v = self.W_v(x).view(B, T, self.num_heads, self.d_k).transpose(1, 2)

        attn = (q @ k.transpose(-2, -1)) / (self.d_k ** 0.5)
        attn = attn.softmax(dim=-1)

        out = (attn @ v).transpose(1, 2).contiguous().view(B, T, C)
        return self.W_o(out)
`;

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = getArticles().find((a) => a.id === id);
  if (!article) notFound();

  const category = getCategories().find((c) => c.id === article.category);

  // Claude Codeに渡すプロンプト
  const claudePrompt = encodeURIComponent(
    `以下のコードをベースに実装を行いたい。\n\n# 論文・記事\n${article.title}\n\n# 概要\n${article.summary}\n\n# コード\n\`\`\`python\n${DUMMY_CODE}\`\`\``
  );

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
          </div>
          <div className="flex items-start gap-3 mb-3">
            <h1 className="text-xl font-semibold text-zinc-900 flex-1">{article.title}</h1>
            <BookmarkButton id={article.id} />
          </div>
          {article.use_case && (
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 mb-3">
              <span className="text-xs text-blue-400">解決する問題</span>
              <span className="text-xs font-medium text-blue-700">{article.use_case}</span>
            </div>
          )}
          <AbstractSection
            abstract={article.abstract ?? article.summary}
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
        </div>

        {/* Source code */}
        {article.hasCode && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs tracking-widest text-zinc-400 uppercase">Source Code</h2>
              <a
                href={`claude://open?prompt=${claudePrompt}`}
                className="text-xs bg-white border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-all"
              >
                Claude Code で実装する →
              </a>
            </div>
            <pre className="bg-zinc-100 border border-zinc-200 p-6 overflow-x-auto text-xs leading-relaxed text-zinc-700 font-mono">
              <code>{DUMMY_CODE}</code>
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
