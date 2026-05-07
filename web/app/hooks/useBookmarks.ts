"use client";

import { useState } from "react";

const STORAGE_KEY = "mlinfo_bookmarks";

export function useBookmarks() {
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch {}
    return new Set();
  });

  const toggleBookmark = (id: string) => {
    setBookmarkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  return { bookmarkIds, toggleBookmark };
}
