import type { Article, Category } from "@/app/data/dummy";
import {
  LEARNING_TAG_LABELS,
  MODALITY_TAG_LABELS,
  TASK_TAG_LABELS,
} from "@/app/data/dummy";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type CostLevel = "Low" | "Medium" | "High";

export type ResourceLink = {
  label: string;
  kind: "paper" | "github" | "huggingface" | "demo" | "project";
  url: string;
};

const HARD_HINTS = [
  "training",
  "pretrain",
  "pre-training",
  "diffusion",
  "video",
  "3d",
  "multimodal",
  "reinforcement",
  "rlhf",
  "large language model",
  "llm",
];

const EASY_HINTS = [
  "framework",
  "library",
  "toolkit",
  "rag",
  "retrieval",
  "embedding",
  "classification",
  "inference",
  "github",
];

export function getArticleUrl(article: Article): string {
  return `/article/${encodeURIComponent(article.id)}`;
}

export function getFieldTags(article: Article, categories: Category[]): string[] {
  const category = categories.find((c) => c.id === article.category);
  const subcategory = category?.subcategories.find((s) => s.id === article.subcategory);
  const labels = [
    category?.name,
    subcategory?.name,
    ...(article.tags?.task ?? []).map((tag) => TASK_TAG_LABELS[tag] ?? tag),
    ...(article.tags?.modality ?? []).map((tag) => MODALITY_TAG_LABELS[tag] ?? tag),
    ...(article.tags?.learning ?? []).map((tag) => LEARNING_TAG_LABELS[tag] ?? tag),
  ].filter(Boolean) as string[];

  return Array.from(new Set(labels)).slice(0, 5);
}

export function getResourceLinks(article: Article): ResourceLink[] {
  const links: ResourceLink[] = [];
  const url = article.url;

  if (article.source === "github") {
    links.push({ label: "GitHub", kind: "github", url });
  } else if (article.source === "huggingface") {
    links.push({ label: "Hugging Face", kind: "huggingface", url });
  } else {
    links.push({ label: "Paper", kind: "paper", url });
  }

  if (article.codeUrl) {
    links.push({ label: "GitHub", kind: "github", url: article.codeUrl });
  }

  return Array.from(new Map(links.map((link) => [`${link.kind}:${link.url}`, link])).values());
}

export function getImplementationStatus(article: Article): string[] {
  const statuses: string[] = [];
  const links = getResourceLinks(article);

  if (links.some((link) => link.kind === "github") || article.source === "github" || article.hasCode) {
    statuses.push("GitHubあり");
  }
  if (links.some((link) => link.kind === "huggingface") || article.source === "huggingface") {
    statuses.push("Hugging Faceあり");
  }
  if (links.some((link) => link.kind === "demo")) {
    statuses.push("Demoあり");
  }
  if (statuses.length === 0 && article.source === "arxiv") {
    statuses.push("Paper only");
  }

  return statuses;
}

export function getArticleSearchText(article: Article): string {
  return [
    article.title,
    article.summary,
    article.summary_ja,
    article.abstract,
    article.use_case,
    article.category,
    article.subcategory,
    ...(article.tags?.task ?? []),
    ...(article.tags?.modality ?? []),
    ...(article.tags?.learning ?? []),
  ].join(" ").toLowerCase();
}

export function estimateDifficulty(article: Article): { level: Difficulty; reason: string } {
  if (article.source === "github" || article.source === "huggingface") {
    return {
      level: "Easy",
      reason: "実装またはモデル配布ページから試せる可能性が高いです。",
    };
  }

  if (!article.hasCode && !article.codeUrl) {
    return {
      level: "Hard",
      reason: "公式実装が見つからないため、論文から再実装する前提です。",
    };
  }

  const text = getArticleSearchText(article);
  if (HARD_HINTS.some((hint) => text.includes(hint))) {
    return {
      level: "Hard",
      reason: "大規模モデル、生成、強化学習など再現コストが高い要素を含みます。",
    };
  }
  if (EASY_HINTS.some((hint) => text.includes(hint))) {
    return {
      level: "Easy",
      reason: "既存実装や推論利用から検証しやすいテーマです。",
    };
  }

  return {
    level: "Medium",
    reason: "実装は参照できますが、データや評価環境の準備が必要です。",
  };
}

export function estimateCost(article: Article): { level: CostLevel; note: string } {
  const text = getArticleSearchText(article);
  if (
    ["diffusion", "video", "3d", "multimodal", "llm", "large language model", "pretrain", "training"].some((hint) =>
      text.includes(hint)
    )
  ) {
    return { level: "High", note: "学習や高解像度推論ではGPUメモリと実行時間に注意が必要です。" };
  }
  if (
    ["rag", "retrieval", "embedding", "classification", "tabular", "time-series", "forecasting"].some((hint) =>
      text.includes(hint)
    )
  ) {
    return { level: "Low", note: "小規模データならCPUまたは単一GPUで検証しやすい領域です。" };
  }
  return { level: "Medium", note: "推論中心なら軽めですが、再学習時はGPUが必要になる可能性があります。" };
}

export function getUseCase(article: Article): string {
  if (article.use_case) return article.use_case;
  const task = article.tags?.task?.[0];
  if (task) return TASK_TAG_LABELS[task] ?? task;
  return article.source === "github" ? "実装・検証基盤" : "技術検証・論文読解補助";
}

export function getShortDescription(article: Article): string {
  return (article.summary_ja || article.summary || article.abstract || "").replace(/\s+/g, " ").slice(0, 110);
}

export function getRelatedArticles(article: Article, articles: Article[], limit = 4): Article[] {
  const taskTags = new Set(article.tags?.task ?? []);
  const modalityTags = new Set(article.tags?.modality ?? []);

  return articles
    .filter((candidate) => candidate.id !== article.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.category === article.category) score += 4;
      if (candidate.subcategory === article.subcategory) score += 3;
      for (const tag of candidate.tags?.task ?? []) if (taskTags.has(tag)) score += 2;
      for (const tag of candidate.tags?.modality ?? []) if (modalityTags.has(tag)) score += 1;
      if (candidate.hasCode) score += 1;
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.publishedAt.localeCompare(a.candidate.publishedAt))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function isMaterialsInformatics(article: Article): boolean {
  const text = getArticleSearchText(article);
  return ["materials", "material", "chemistry", "molecule", "bayesian", "sensor", "manufacturing"].some((hint) =>
    text.includes(hint)
  );
}

export function getImplementationScore(article: Article): number {
  const difficulty = estimateDifficulty(article).level;
  const cost = estimateCost(article).level;
  const statuses = getImplementationStatus(article);
  const likes = Math.min(30, Math.log10((article.likes_count ?? 0) + 1) * 8);
  const dateScore = Math.max(0, 20 - Math.floor((Date.now() - new Date(article.publishedAt).getTime()) / 86400000));

  return Math.round(
    (statuses.some((status) => status !== "Paper only") ? 25 : 0) +
      (statuses.includes("Hugging Faceあり") ? 10 : 0) +
      (difficulty === "Easy" ? 20 : difficulty === "Medium" ? 10 : 0) +
      (cost === "Low" ? 10 : cost === "Medium" ? 5 : 0) +
      likes +
      dateScore
  );
}

export type ImplementationChecklistItem = {
  label: string;
  status: "ok" | "warning" | "unknown";
  detail: string;
};

export function getImplementationChecklist(article: Article): ImplementationChecklistItem[] {
  const links = getResourceLinks(article);
  const difficulty = estimateDifficulty(article);
  const cost = estimateCost(article);

  return [
    {
      label: "実装または配布ページ",
      status: article.hasCode || article.source === "github" || article.source === "huggingface" ? "ok" : "warning",
      detail: article.hasCode || article.source === "github" || article.source === "huggingface"
        ? "コードまたはモデル配布ページから検証を始められます。"
        : "Paper onlyの可能性があるため再実装前提で確認してください。",
    },
    {
      label: "一次情報リンク",
      status: links.length > 0 ? "ok" : "unknown",
      detail: links.length > 0 ? links.map((link) => link.label).join(" / ") : "URL未取得です。",
    },
    {
      label: "検証しやすさ",
      status: difficulty.level === "Easy" ? "ok" : difficulty.level === "Medium" ? "unknown" : "warning",
      detail: difficulty.reason,
    },
    {
      label: "計算資源",
      status: cost.level === "Low" ? "ok" : cost.level === "Medium" ? "unknown" : "warning",
      detail: cost.note,
    },
    {
      label: "ライセンス",
      status: "unknown",
      detail: "配布元のLICENSE、モデルカード、Paperの利用条件を確認してください。",
    },
    {
      label: "商用利用",
      status: "unknown",
      detail: "研究利用限定、データセット由来制限、API規約の有無を確認してください。",
    },
  ];
}

export function matchesKeywords(article: Article, keywords: string[]): boolean {
  const text = getArticleSearchText(article);
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}
