"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="論文・記事を検索…"
        className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs px-3 py-1.5 w-48 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
      />
      <button
        type="submit"
        className="text-xs border border-zinc-700 px-3 py-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
      >
        検索
      </button>
    </form>
  );
}
