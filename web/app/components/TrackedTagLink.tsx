"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  href: string;
  tag: string;
  className?: string;
  children: ReactNode;
};

export default function TrackedTagLink({ href, tag, className, children }: Props) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent("tag_click", { tag })}>
      {children}
    </Link>
  );
}
