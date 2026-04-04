"use client";

import { useBookmarks } from "@/app/hooks/useBookmarks";

export default function BookmarkButton({ id }: { id: string }) {
  const { bookmarkIds, toggleBookmark } = useBookmarks();
  const isBookmarked = bookmarkIds.has(id);

  return (
    <button
      onClick={(e) => { e.preventDefault(); toggleBookmark(id); }}
      className={`shrink-0 text-lg transition-colors ${
        isBookmarked ? "text-amber-400 hover:text-zinc-400" : "text-zinc-200 hover:text-amber-400"
      }`}
      title={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
    >
      ★
    </button>
  );
}
