import type { Article } from "@/app/data/dummy";
import { getImplementationScore, matchesKeywords } from "@/lib/articleInsights";

export type Topic = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  relatedTags: string[];
  kind: "topic" | "use-case";
};

export const topics: Topic[] = [
  {
    slug: "rag",
    title: "RAG",
    description: "検索拡張生成、文書検索、社内ナレッジQAに関係する論文・実装をまとめます。",
    keywords: ["rag", "retrieval", "knowledge", "embedding", "qa", "search"],
    relatedTags: ["LLM", "検索", "埋め込み", "文書QA"],
    kind: "topic",
  },
  {
    slug: "llm-fine-tuning",
    title: "LLM Fine-tuning",
    description: "LoRA、RLHF、SFT、軽量ファインチューニングなど、LLMを用途に合わせる技術を扱います。",
    keywords: ["llm", "large language model", "lora", "fine-tuning", "finetuning", "rlhf", "sft"],
    relatedTags: ["LLM", "LoRA", "RLHF", "Fine-tuning"],
    kind: "topic",
  },
  {
    slug: "materials-informatics",
    title: "Materials Informatics",
    description: "材料探索、分子・結晶、化学、製造プロセス最適化に応用しやすいAI技術を集めます。",
    keywords: ["materials", "material", "chemistry", "molecule", "crystal", "manufacturing", "bayesian"],
    relatedTags: ["材料探索", "分子", "化学", "製造業"],
    kind: "topic",
  },
  {
    slug: "bayesian-optimization",
    title: "Bayesian Optimization",
    description: "少数試行で条件探索を進めるベイズ最適化、実験計画、ブラックボックス最適化を扱います。",
    keywords: ["bayesian optimization", "bayesian", "black-box", "optimization", "experiment design"],
    relatedTags: ["最適化", "実験計画", "材料探索", "製造条件"],
    kind: "topic",
  },
  {
    slug: "sensor-data-analysis",
    title: "Sensor Data Analysis",
    description: "センサ、時系列、異常検知、予測保全に使える機械学習・深層学習技術をまとめます。",
    keywords: ["sensor", "time-series", "timeseries", "forecasting", "anomaly", "predictive maintenance"],
    relatedTags: ["時系列", "異常検知", "センサ", "予測保全"],
    kind: "topic",
  },
  {
    slug: "diffusion-models",
    title: "Diffusion Models",
    description: "画像・動画生成、条件付き生成、編集、3D生成に関係する拡散モデルの論文と実装です。",
    keywords: ["diffusion", "image generation", "video generation", "denoising", "stable diffusion"],
    relatedTags: ["生成AI", "画像生成", "動画生成", "拡散モデル"],
    kind: "topic",
  },
  {
    slug: "ai-agent",
    title: "AI Agent",
    description: "ツール利用、計画、マルチエージェント、コード実行などエージェント実装に関係する情報です。",
    keywords: ["agent", "tool use", "planning", "multi-agent", "autonomous", "workflow"],
    relatedTags: ["Agent", "LLM", "ワークフロー", "自律実行"],
    kind: "topic",
  },
];

export const useCases: Topic[] = [
  {
    slug: "document-search",
    title: "文書検索・社内QA",
    description: "RAG、埋め込み、検索評価、要約を使って文書検索や社内QAを作るための技術です。",
    keywords: ["rag", "retrieval", "embedding", "document", "qa", "summarization"],
    relatedTags: ["RAG", "検索", "要約", "社内QA"],
    kind: "use-case",
  },
  {
    slug: "material-discovery",
    title: "材料探索",
    description: "材料候補探索、分子生成、実験条件探索、ベイズ最適化に関係する技術です。",
    keywords: ["materials", "material", "molecule", "chemistry", "bayesian", "optimization"],
    relatedTags: ["Materials Informatics", "ベイズ最適化", "分子", "探索"],
    kind: "use-case",
  },
  {
    slug: "manufacturing-anomaly-detection",
    title: "製造業の異常検知",
    description: "センサ時系列、画像検査、予測保全、異常スコアリングに使えるAI技術を整理します。",
    keywords: ["manufacturing", "sensor", "anomaly", "detection", "time-series", "vision"],
    relatedTags: ["製造業", "異常検知", "センサ", "画像検査"],
    kind: "use-case",
  },
];

export const comparisons = [
  {
    slug: "rag",
    title: "RAG手法比較",
    description: "検索、埋め込み、再ランキング、生成のどこを改善する手法かで比較します。",
    keywords: ["rag", "retrieval", "embedding", "rerank", "qa"],
  },
  {
    slug: "llm-fine-tuning",
    title: "LLM fine-tuning比較",
    description: "LoRA、SFT、RLHF、軽量化など、モデル調整手法の実装難易度とコストを比較します。",
    keywords: ["lora", "fine-tuning", "rlhf", "sft", "llm"],
  },
  {
    slug: "anomaly-detection",
    title: "異常検知手法比較",
    description: "センサ、画像、表形式データに対する異常検知手法を用途別に比較します。",
    keywords: ["anomaly", "detection", "sensor", "time-series", "vision"],
  },
];

export function getTopicArticles(topic: Topic, articles: Article[], limit?: number): Article[] {
  const matched = articles
    .filter((article) => matchesKeywords(article, topic.keywords))
    .sort((a, b) => getImplementationScore(b) - getImplementationScore(a) || b.publishedAt.localeCompare(a.publishedAt));
  return typeof limit === "number" ? matched.slice(0, limit) : matched;
}
