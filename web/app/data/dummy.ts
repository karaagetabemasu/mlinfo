export type Article = {
  id: string;
  title: string;
  summary: string;
  abstract?: string;
  abstract_ja?: string;
  source: "arxiv" | "qiita";
  url: string;
  category: string;
  subcategory: string;
  publishedAt: string;
  hasCode: boolean;
  codeUrl?: string;
  likes_count?: number;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  subcategories: Subcategory[];
};

export type Subcategory = {
  id: string;
  name: string;
  articleCount: number;
};

export const categories: Category[] = [
  {
    id: "machine-learning",
    name: "機械学習",
    color: "border-l-blue-600",
    subcategories: [
      { id: "supervised", name: "教師あり学習", articleCount: 12 },
      { id: "unsupervised", name: "教師なし学習", articleCount: 8 },
      { id: "semi-supervised", name: "半教師あり学習", articleCount: 4 },
      { id: "ensemble", name: "アンサンブル学習", articleCount: 7 },
      { id: "feature", name: "特徴量エンジニアリング", articleCount: 9 },
      { id: "tabular", name: "表形式データ", articleCount: 14 },
      { id: "timeseries", name: "時系列", articleCount: 10 },
      { id: "anomaly", name: "異常検知", articleCount: 5 },
    ],
  },
  {
    id: "deep-learning",
    name: "深層学習",
    color: "border-l-violet-600",
    subcategories: [
      { id: "transformer", name: "Transformer", articleCount: 24 },
      { id: "cnn", name: "CNN", articleCount: 15 },
      { id: "rnn", name: "RNN / LSTM", articleCount: 9 },
      { id: "gnn", name: "グラフニューラルネット", articleCount: 6 },
      { id: "attention", name: "Attention機構", articleCount: 11 },
      { id: "normalization", name: "正規化・最適化手法", articleCount: 8 },
      { id: "efficient", name: "軽量化・量子化", articleCount: 7 },
    ],
  },
  {
    id: "nlp",
    name: "自然言語処理",
    color: "border-l-emerald-600",
    subcategories: [
      { id: "llm", name: "大規模言語モデル", articleCount: 31 },
      { id: "rag", name: "RAG", articleCount: 16 },
      { id: "fine-tuning", name: "ファインチューニング", articleCount: 13 },
      { id: "prompt", name: "プロンプトエンジニアリング", articleCount: 18 },
      { id: "embedding", name: "埋め込み・検索", articleCount: 9 },
      { id: "tokenization", name: "トークナイザ", articleCount: 4 },
    ],
  },
  {
    id: "computer-vision",
    name: "コンピュータビジョン",
    color: "border-l-orange-600",
    subcategories: [
      { id: "detection", name: "物体検出", articleCount: 14 },
      { id: "segmentation", name: "セグメンテーション", articleCount: 10 },
      { id: "classification", name: "画像分類", articleCount: 12 },
      { id: "3d", name: "3D・点群", articleCount: 6 },
      { id: "video", name: "動画認識", articleCount: 7 },
      { id: "multimodal", name: "マルチモーダル", articleCount: 11 },
    ],
  },
  {
    id: "generative-ai",
    name: "生成AI",
    color: "border-l-pink-600",
    subcategories: [
      { id: "diffusion", name: "拡散モデル", articleCount: 18 },
      { id: "gan", name: "GAN", articleCount: 9 },
      { id: "vae", name: "VAE", articleCount: 5 },
      { id: "image-gen", name: "画像生成", articleCount: 22 },
      { id: "video-gen", name: "動画生成", articleCount: 8 },
      { id: "audio-gen", name: "音声・音楽生成", articleCount: 6 },
    ],
  },
  {
    id: "reinforcement-learning",
    name: "強化学習",
    color: "border-l-yellow-600",
    subcategories: [
      { id: "model-free", name: "モデルフリー (DQN / SAC)", articleCount: 8 },
      { id: "ppo", name: "方策勾配 (PPO / A3C)", articleCount: 6 },
      { id: "model-based", name: "モデルベース", articleCount: 5 },
      { id: "rlhf", name: "RLHF", articleCount: 11 },
      { id: "multi-agent", name: "マルチエージェント", articleCount: 4 },
    ],
  },
  {
    id: "mlops",
    name: "MLOps",
    color: "border-l-zinc-500",
    subcategories: [
      { id: "experiment", name: "実験管理", articleCount: 7 },
      { id: "deployment", name: "モデルデプロイ", articleCount: 5 },
      { id: "monitoring", name: "モニタリング・ドリフト検知", articleCount: 4 },
      { id: "pipeline", name: "パイプライン構築", articleCount: 6 },
      { id: "data-management", name: "データ管理・バージョニング", articleCount: 3 },
    ],
  },
  {
    id: "math-theory",
    name: "数学・理論",
    color: "border-l-cyan-600",
    subcategories: [
      { id: "optimization", name: "最適化", articleCount: 9 },
      { id: "probability", name: "確率・統計", articleCount: 7 },
      { id: "information-theory", name: "情報理論", articleCount: 4 },
      { id: "linear-algebra", name: "線形代数", articleCount: 5 },
      { id: "interpretability", name: "解釈可能性 (XAI)", articleCount: 8 },
    ],
  },
];

export const articles: Article[] = [
  {
    id: "1",
    title: "Attention Is All You Need",
    summary: "自己注意機構のみを使ったTransformerアーキテクチャを提案。翻訳タスクでSoTA達成。",
    source: "arxiv",
    url: "https://arxiv.org/abs/1706.03762",
    category: "deep-learning",
    subcategory: "transformer",
    publishedAt: "2023-11-01",
    hasCode: true,
    codeUrl: "https://github.com/tensorflow/tensor2tensor",
  },
  {
    id: "2",
    title: "LightGBM を使った特徴量重要度の可視化",
    summary: "LightGBMのSHAP値を使った特徴量重要度の可視化方法とKaggleでの活用例を解説。",
    source: "qiita",
    url: "https://qiita.com/",
    category: "machine-learning",
    subcategory: "feature",
    publishedAt: "2024-01-15",
    hasCode: true,
    codeUrl: "https://github.com/",
  },
  {
    id: "3",
    title: "Denoising Diffusion Probabilistic Models",
    summary: "拡散過程を用いた高品質な画像生成モデル。GANを超える生成品質を実現。",
    source: "arxiv",
    url: "https://arxiv.org/abs/2006.11239",
    category: "generative-ai",
    subcategory: "diffusion",
    publishedAt: "2023-12-20",
    hasCode: true,
    codeUrl: "https://github.com/hojonathanho/diffusion",
  },
  {
    id: "4",
    title: "PPOを使った強化学習エージェントの実装",
    summary: "Proximal Policy Optimizationの実装解説とOpenAI Gymでの実験結果。",
    source: "qiita",
    url: "https://qiita.com/",
    category: "reinforcement-learning",
    subcategory: "ppo",
    publishedAt: "2024-02-10",
    hasCode: true,
  },
  {
    id: "5",
    title: "RLHF: Learning to summarize from human feedback",
    summary: "人間のフィードバックを活用した強化学習でLLMを人間の意図に合わせる手法。",
    source: "arxiv",
    url: "https://arxiv.org/abs/2009.01325",
    category: "reinforcement-learning",
    subcategory: "rlhf",
    publishedAt: "2024-01-05",
    hasCode: false,
  },
  {
    id: "6",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    summary: "外部知識ベースを検索して回答を生成するRAGフレームワーク。LLMの幻覚問題を軽減。",
    source: "arxiv",
    url: "https://arxiv.org/abs/2005.11401",
    category: "nlp",
    subcategory: "rag",
    publishedAt: "2024-02-01",
    hasCode: true,
  },
  {
    id: "7",
    title: "LoRA: Low-Rank Adaptation of Large Language Models",
    summary: "少数のパラメータ追加で大規模モデルを効率的にファインチューニングする手法。",
    source: "arxiv",
    url: "https://arxiv.org/abs/2106.09685",
    category: "nlp",
    subcategory: "fine-tuning",
    publishedAt: "2024-01-20",
    hasCode: true,
  },
  {
    id: "8",
    title: "YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information",
    summary: "情報ボトルネック問題を解決する新しいYOLOアーキテクチャ。物体検出でSoTA更新。",
    source: "arxiv",
    url: "https://arxiv.org/abs/2402.13616",
    category: "computer-vision",
    subcategory: "detection",
    publishedAt: "2024-02-21",
    hasCode: true,
  },
];
