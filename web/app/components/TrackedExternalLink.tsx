"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  href: string;
  kind: string;
  articleId?: string;
  className?: string;
  children: ReactNode;
};

export default function TrackedExternalLink({ href, kind, articleId, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackEvent("external_link_click", { kind, article_id: articleId, url: href })}
    >
      {children}
    </a>
  );
}
