"use client";

import { useEffect } from "react";
import { useReadArticles } from "@/app/hooks/useReadArticles";

export default function MarkAsRead({ id }: { id: string }) {
  const { markAsRead } = useReadArticles();
  useEffect(() => { markAsRead(id); }, [id]);
  return null;
}
