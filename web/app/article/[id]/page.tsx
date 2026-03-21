import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles, getCategories } from "@/lib/data";
import AbstractSection from "@/app/components/AbstractSection";

type Props = {
  params: Promise<{ id: string }>;
};

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
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-8 py-5 flex items-center gap-4">
        <Link href="/" className="text-zinc-600 hover:text-white text-sm transition-colors">
          MLinfo
        </Link>
        <span className="text-zinc-700">/</span>
        {category && (
          <>
            <Link
              href={`/category/${category.id}`}
              className="text-zinc-600 hover:text-white text-sm transition-colors"
            >
              {category.name}
            </Link>
            <span className="text-zinc-700">/</span>
          </>
        )}
        <span className="text-sm text-zinc-400 truncate max-w-xs">{article.title}</span>
      </header>

      <div className="px-8 py-8 max-w-4xl mx-auto">
        {/* Article meta */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs px-2 py-0.5 border ${
              article.source === "arxiv"
                ? "border-zinc-600 text-zinc-400"
                : "border-zinc-700 text-zinc-500"
            }`}>
              {article.source}
            </span>
            <span className="text-zinc-700 text-xs">{article.publishedAt}</span>
          </div>
          <h1 className="text-xl font-semibold mb-3">{article.title}</h1>
          <AbstractSection
            abstract={article.abstract ?? article.summary}
            abstract_ja={article.abstract_ja}
            source={article.source}
          />
        </div>

        {/* Links */}
        <div className="flex gap-3 mb-8">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-zinc-700 px-4 py-2 hover:border-zinc-400 transition-colors"
          >
            論文・記事を開く →
          </a>
        </div>

        {/* Source code */}
        {article.hasCode && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs tracking-widest text-zinc-500 uppercase">Source Code</h2>
              <a
                href={`claude://open?prompt=${claudePrompt}`}
                className="text-xs bg-zinc-900 border border-zinc-700 px-4 py-2 hover:border-zinc-400 hover:bg-zinc-800 transition-all"
              >
                Claude Code で実装する →
              </a>
            </div>
            <pre className="bg-zinc-950 border border-zinc-800 p-6 overflow-x-auto text-xs leading-relaxed text-zinc-300 font-mono">
              <code>{DUMMY_CODE}</code>
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
