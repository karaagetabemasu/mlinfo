import Logo from "@/app/components/Logo";
import SearchBar from "@/app/components/SearchBar";
import SavedArticles from "@/app/saved/SavedArticles";
import { getArticles, getCategories } from "@/lib/data";

export const metadata = {
  title: "保存した記事",
  description: "あとで実装・比較したいAI/機械学習記事をブックマークから再開できます。",
};

export default function SavedPage() {
  const articles = getArticles();
  const categories = getCategories();

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <Logo />
        <SearchBar />
      </header>
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <p className="text-xs tracking-widest text-zinc-400 uppercase mb-2">Saved</p>
        <h1 className="text-2xl font-semibold text-zinc-950 mb-3">保存した記事</h1>
        <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl mb-6">
          あとで検証したい技術、比較したい実装候補、読み返したい論文をここから再開できます。
        </p>
        <SavedArticles articles={articles} categories={categories} />
      </div>
    </main>
  );
}
