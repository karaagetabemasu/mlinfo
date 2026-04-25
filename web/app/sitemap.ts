import { getArticles, getCategories } from "@/lib/data";
import type { MetadataRoute } from "next";

const BASE_URL = "https://mlinfo.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles();
  const categories = getCategories();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/privacy`, priority: 0.3, changeFrequency: "yearly" },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/category/${c.id}`,
    priority: 0.8,
    changeFrequency: "daily",
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/article/${encodeURIComponent(a.id)}`,
    lastModified: a.publishedAt,
    priority: 0.6,
    changeFrequency: "weekly",
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}
