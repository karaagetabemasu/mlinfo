import { notFound } from "next/navigation";
import { getArticles, getCategories } from "@/lib/data";
import ArticleListWithFilter from "@/app/components/ArticleListWithFilter";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";

type Props = {
  params: Promise<{ id: string }>;
};

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
  const subcategoryNameMap = Object.fromEntries(
    category.subcategories.map((s) => [s.id, s.name])
  );

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
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

      <ArticleListWithFilter articles={categoryArticles} category={category} subcategoryNameMap={subcategoryNameMap} />
    </main>
  );
}
