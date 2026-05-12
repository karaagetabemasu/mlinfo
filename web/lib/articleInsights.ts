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

export type ManufacturingSignalKey =
  | "smallData"
  | "tabular"
  | "interpretable"
  | "lowResource"
  | "materials"
  | "sensor"
  | "quality"
  | "optimization"
  | "visualInspection";

export type ManufacturingSignal = {
  key: ManufacturingSignalKey;
  label: string;
  active: boolean;
  reason: string;
};

const MANUFACTURING_HINTS = {
  smallData: ["bayesian", "gaussian process", "active learning", "few-shot", "small data", "experiment design", "doe"],
  tabular: ["tabular", "table", "csv", "excel", "xgboost", "lightgbm", "random forest", "gradient boosting", "process condition"],
  interpretable: ["interpretable", "interpretability", "explainable", "xai", "shap", "feature importance", "surrogate"],
  lowResource: ["lightgbm", "xgboost", "random forest", "linear", "cpu", "scikit", "sklearn", "bayesian optimization"],
  materials: [
    "materials",
    "material",
    "matminer",
    "smiles",
    "perovskite",
    "alloy",
    "polymer",
    "dft",
    "density functional",
    "molecule",
    "crystal",
    "catalyst",
    "battery",
    "composition",
  ],
  sensor: ["sensor", "time-series", "timeseries", "vibration", "signal", "forecasting", "predictive maintenance"],
  quality: ["quality", "defect", "inspection", "anomaly", "yield", "process", "manufacturing"],
  optimization: ["bayesian", "optimization", "black-box", "experiment design", "active learning", "multi-objective"],
  visualInspection: ["inspection", "defect", "segmentation", "detection", "vision", "image", "surface"],
} satisfies Record<ManufacturingSignalKey, string[]>;

const MANUFACTURING_LABELS: Record<ManufacturingSignalKey, string> = {
  smallData: "少数データ向き",
  tabular: "表形式向き",
  interpretable: "説明可能",
  lowResource: "CPUで試しやすい",
  materials: "MI向き",
  sensor: "センサ/時系列",
  quality: "品質予測/異常検知",
  optimization: "条件最適化",
  visualInspection: "画像検査",
};

const MANUFACTURING_REASONS: Record<ManufacturingSignalKey, string> = {
  smallData: "ベイズ最適化、能動学習、実験計画など少数試行の文脈に近いキーワードがあります。",
  tabular: "実験条件テーブル、CSV、表形式モデルから始めやすい可能性があります。",
  interpretable: "SHAP、特徴量重要度、解釈可能性など説明に使える要素があります。",
  lowResource: "LightGBM、scikit-learn系、最適化手法などCPU検証しやすい文脈です。",
  materials: "材料、分子、組成、DFT、matminerなどMaterials Informaticsに近い文脈です。",
  sensor: "センサ、時系列、予測保全、信号データの文脈があります。",
  quality: "品質、欠陥、異常検知、製造プロセスの文脈があります。",
  optimization: "工程条件、配合、実験条件の探索に使える最適化文脈があります。",
  visualInspection: "外観検査、欠陥検出、画像認識に近い文脈があります。",
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

export function getManufacturingSignals(article: Article): ManufacturingSignal[] {
  const text = getArticleSearchText(article);
  return (Object.keys(MANUFACTURING_HINTS) as ManufacturingSignalKey[]).map((key) => ({
    key,
    label: MANUFACTURING_LABELS[key],
    active: MANUFACTURING_HINTS[key].some((hint) => text.includes(hint)),
    reason: MANUFACTURING_REASONS[key],
  }));
}

export function getActiveManufacturingSignals(article: Article, limit?: number): ManufacturingSignal[] {
  const signals = getManufacturingSignals(article).filter((signal) => signal.active);
  return typeof limit === "number" ? signals.slice(0, limit) : signals;
}

export function getManufacturingFitScore(article: Article): number {
  const active = getActiveManufacturingSignals(article);
  const implementationScore = getImplementationScore(article);
  const base = active.length * 12;
  const miBoost = active.some((signal) => signal.key === "materials") ? 16 : 0;
  const practicalBoost = active.some((signal) => ["smallData", "tabular", "lowResource", "interpretable"].includes(signal.key)) ? 14 : 0;
  return Math.min(100, Math.round(base + miBoost + practicalBoost + implementationScore * 0.25));
}

export function isManufacturingRelevant(article: Article): boolean {
  return getManufacturingFitScore(article) >= 30;
}

export function getInternalizationSteps(article: Article): string[] {
  const signals = getActiveManufacturingSignals(article);
  const hasTabular = signals.some((signal) => signal.key === "tabular");
  const hasOptimization = signals.some((signal) => signal.key === "optimization");
  const hasSensor = signals.some((signal) => signal.key === "sensor");
  const hasVision = signals.some((signal) => signal.key === "visualInspection");
  const hasMaterials = signals.some((signal) => signal.key === "materials");

  return [
    hasTabular || hasMaterials
      ? "まずExcel/CSVの実験条件、組成、物性値を1行1実験の表に整理します。"
      : "まず自社データを、入力条件、目的変数、評価したい指標に分けて整理します。",
    hasOptimization
      ? "既存データで予測モデルを作り、ベイズ最適化で次に試す条件を提案する流れを作ります。"
      : hasSensor
        ? "正常データだけで動くベースラインを作り、異常スコアのしきい値を現場知見と合わせます。"
        : hasVision
          ? "良品/不良品または欠陥領域のラベル有無を確認し、分類・検出・セグメンテーションのどれで始めるか決めます。"
          : "LightGBMやRandom Forestなどのベースラインを先に作り、この手法と比較します。",
    "評価指標はR2/RMSE、AUC、異常検知の再現率、実験回数削減率など、現場の意思決定に近いものを選びます。",
    "SHAPや特徴量重要度で、効いている因子が物理・化学・工程知識と矛盾しないか確認します。",
  ];
}

export function getClaudeCodePrompt(article: Article): string {
  return [
    "# 目的",
    "製造業・材料開発の自社データで、この論文/実装の考え方をPoCできる最小実装を作りたいです。",
    "",
    "# 対象技術",
    article.title,
    "",
    "# 概要",
    article.summary_ja || article.summary || article.abstract || "",
    "",
    "# 前提データ",
    "- ExcelまたはCSVの表形式データから始めます",
    "- 1行が1実験または1ロットです",
    "- 入力: 組成、配合、工程条件、センサ統計量など",
    "- 目的変数: 物性値、品質指標、不良有無、異常スコアなど",
    "",
    "# 作ってほしいもの",
    "1. データ読み込みと前処理",
    "2. まず比較するベースライン",
    "3. この手法を試す最小実装",
    "4. 評価指標と可視化",
    "5. SHAPまたは特徴量重要度による説明",
    "6. 次の実験条件や改善案",
    "",
    "# 注意",
    "製造業の少数データを想定し、GPU必須の実装よりも社内PCで試せる構成を優先してください。",
  ].join("\n");
}
