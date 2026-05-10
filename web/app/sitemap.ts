import { getArticles, getCategories } from "@/lib/data";
import { topics, useCases } from "@/lib/topicCatalog";
import type { MetadataRoute } from "next";

const BASE_URL = "https://mlinfo.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles();
  const categories = getCategories();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/topics`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/weekly`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/compare`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE_URL}/saved`, priority: 0.4, changeFrequency: "monthly" },
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

  const topicPages: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${BASE_URL}/topics/${topic.slug}`,
    priority: topic.slug === "materials-informatics" ? 0.95 : 0.85,
    changeFrequency: "daily",
  }));

  const useCasePages: MetadataRoute.Sitemap = useCases.map((useCase) => ({
    url: `${BASE_URL}/use-cases/${useCase.slug}`,
    priority: 0.9,
    changeFrequency: "daily",
  }));

  return [...staticPages, ...categoryPages, ...topicPages, ...useCasePages, ...articlePages];
}
