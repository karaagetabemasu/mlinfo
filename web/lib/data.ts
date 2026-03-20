import fs from "fs";
import path from "path";
import { categories, type Article } from "@/app/data/dummy";

type ArticlesJson = {
  lastUpdated: string;
  articles: Article[];
};

function loadArticles(): ArticlesJson {
  const filePath = path.join(process.cwd(), "data", "articles.json");
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ArticlesJson;
  }
  // JSONがなければダミーデータにフォールバック
  return { lastUpdated: "", articles: [] };
}

export function getArticles(): Article[] {
  return loadArticles().articles;
}

export function getLastUpdated(): string {
  return loadArticles().lastUpdated;
}

export function getCategories() {
  return categories;
}
