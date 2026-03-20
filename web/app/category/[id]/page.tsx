import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles, getCategories } from "@/lib/data";
import ArticleListWithFilter from "@/app/components/ArticleListWithFilter";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  const categories = getCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const categoryArticles = getArticles().filter((a) => a.category === id);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white text-sm transition-colors">
            MLinfo
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-semibold">{category.name}</h1>
        </div>
        <span className="text-zinc-500 text-xs">{categoryArticles.length} articles</span>
      </header>

      <ArticleListWithFilter articles={categoryArticles} category={category} />
    </main>
  );
}
