"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function ScrollDepthTracker({ articleId }: { articleId?: string }) {
  useEffect(() => {
    const fired = new Set<number>();
    const depths = [25, 50, 75, 100];

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const depth of depths) {
        if (percent >= depth && !fired.has(depth)) {
          fired.add(depth);
          trackEvent("scroll_depth", { depth, article_id: articleId });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [articleId]);

  return null;
}
