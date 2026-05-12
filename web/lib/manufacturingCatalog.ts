import type { Article } from "@/app/data/dummy";
import { getManufacturingFitScore, matchesKeywords } from "@/lib/articleInsights";

export type ManufacturingGuide = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  problem: string;
  recommendedMethods: string[];
  firstSteps: string[];
  dataShape: string;
  baseline: string;
  evaluation: string;
  keywords: string[];
};

export const manufacturingGuides: ManufacturingGuide[] = [
  {
    slug: "formulation-optimization",
    title: "配合・組成最適化",
    shortTitle: "配合最適化",
    description: "樹脂、電池、触媒、合金などの配合・組成を、少ない実験回数で改善するためのAI/MI導線です。",
    problem: "候補組成や配合条件の組み合わせが多く、全探索できない。",
    recommendedMethods: ["LightGBM / Random Forest", "Gaussian Process", "Bayesian Optimization", "Active Learning", "SHAP"],
    firstSteps: [
      "過去実験を1行1条件のCSVに整え、組成・工程条件・物性値を分けます。",
      "まずLightGBMなどで品質や物性値を予測するベースラインを作ります。",
      "SHAPで効いている因子を確認し、現場知見と矛盾がないか見ます。",
      "ベイズ最適化で次に試す配合候補を数点だけ提案します。",
    ],
    dataShape: "組成、配合比、工程条件、測定物性を含む表形式データ",
    baseline: "LightGBM + SHAP",
    evaluation: "RMSE/R2、上位候補の実験成功率、実験回数削減率",
    keywords: ["formulation", "composition", "alloy", "polymer", "materials", "bayesian", "optimization", "active learning"],
  },
  {
    slug: "quality-prediction",
    title: "品質予測",
    shortTitle: "品質予測",
    description: "工程条件、原料ロット、測定値から、品質指標や不良リスクを予測するための実装ガイドです。",
    problem: "製造条件と品質の関係をモデル化し、早期にリスクを見つけたい。",
    recommendedMethods: ["LightGBM", "XGBoost", "Random Forest", "Calibration", "SHAP"],
    firstSteps: [
      "ロットごとに工程条件、検査値、品質結果を横持ちの表にします。",
      "リークしやすい事後情報を除外し、時系列分割で評価します。",
      "LightGBMでベースラインを作り、重要因子をSHAPで確認します。",
      "品質しきい値をもとに、回帰と分類の両方で評価します。",
    ],
    dataShape: "ロット、工程条件、原料情報、検査値、品質指標を含む表形式データ",
    baseline: "LightGBM分類/回帰",
    evaluation: "RMSE、AUC、再現率、誤アラート率",
    keywords: ["quality", "yield", "process", "tabular", "lightgbm", "xgboost", "manufacturing"],
  },
  {
    slug: "process-anomaly-detection",
    title: "工程条件の異常検知",
    shortTitle: "異常検知",
    description: "正常データが中心の工程・設備データから、外れ値や異常兆候を見つけるための導線です。",
    problem: "不良や異常のラベルが少なく、正常データだけで監視を始めたい。",
    recommendedMethods: ["Isolation Forest", "One-Class SVM", "AutoEncoder", "Change Point Detection", "Robust Statistics"],
    firstSteps: [
      "まず正常期間を定義し、センサや工程値の欠損・外れ値を整理します。",
      "Isolation ForestなどCPUで動く手法をベースラインにします。",
      "異常スコアの時系列を可視化し、既知トラブル日と照合します。",
      "現場が対応できるしきい値と通知頻度を決めます。",
    ],
    dataShape: "タイムスタンプ、設備ID、センサ値、工程条件、イベント履歴",
    baseline: "Isolation Forest",
    evaluation: "既知異常の検出率、誤報率、検知リードタイム",
    keywords: ["anomaly", "sensor", "time-series", "timeseries", "process", "manufacturing", "predictive maintenance"],
  },
  {
    slug: "material-screening",
    title: "材料候補スクリーニング",
    shortTitle: "材料探索",
    description: "材料候補、分子、結晶、組成から、次に評価すべき候補を絞り込むためのMIガイドです。",
    problem: "候補材料が多く、実験・計算コストの高い評価を全部は実施できない。",
    recommendedMethods: ["Matminer", "Molecular Descriptors", "GNN", "Active Learning", "Uncertainty Sampling"],
    firstSteps: [
      "材料ID、組成、SMILES、既知物性値を同じ表にそろえます。",
      "matminerや記述子で、まず表形式特徴量を作ります。",
      "LightGBMなどのベースラインとGNN系手法を比較します。",
      "予測値と不確実性から、次に評価する候補を選びます。",
    ],
    dataShape: "組成、SMILES、結晶構造、計算/実験物性値",
    baseline: "記述子 + LightGBM",
    evaluation: "上位候補のヒット率、MAE/RMSE、候補削減率",
    keywords: ["materials", "material", "matminer", "smiles", "molecule", "crystal", "dft", "perovskite", "alloy"],
  },
  {
    slug: "visual-inspection",
    title: "外観検査・欠陥検出",
    shortTitle: "画像検査",
    description: "製品画像、顕微鏡画像、表面欠陥を対象に、分類・検出・セグメンテーションを選ぶための導線です。",
    problem: "不良画像が少なく、検査ルールをAIで補助したい。",
    recommendedMethods: ["Image Classification", "Object Detection", "Segmentation", "Anomaly Detection", "Few-shot Vision"],
    firstSteps: [
      "良品/不良品、欠陥位置ラベルの有無を確認します。",
      "ラベルが少ない場合は良品学習型の異常検知から試します。",
      "欠陥位置が必要ならセグメンテーション、種類判定なら分類を選びます。",
      "見逃し率を優先して評価し、誤検知とのバランスを調整します。",
    ],
    dataShape: "検査画像、良否ラベル、欠陥カテゴリ、必要に応じてマスク/矩形ラベル",
    baseline: "良品学習型異常検知または画像分類",
    evaluation: "再現率、見逃し率、誤検知率、検査時間",
    keywords: ["inspection", "defect", "vision", "image", "segmentation", "detection", "anomaly"],
  },
  {
    slug: "technical-document-search",
    title: "技術文書・実験ノート検索",
    shortTitle: "文書検索",
    description: "過去の実験ノート、技術報告書、特許、論文を探しやすくするための製造業向けRAG導線です。",
    problem: "過去の実験知見や失敗条件が文書に埋もれて再利用されない。",
    recommendedMethods: ["Embedding Search", "RAG", "Hybrid Search", "Reranking", "Citation-aware Summaries"],
    firstSteps: [
      "文書を案件、材料、設備、試験条件などのメタデータ付きで整理します。",
      "まず埋め込み検索で、キーワード検索より拾える情報が増えるか確認します。",
      "回答生成より先に、根拠文書を正しく返す検索評価を作ります。",
      "機密情報の保存先とアクセス権限を確認してから展開します。",
    ],
    dataShape: "PDF、実験ノート、技術報告書、特許、論文メモ、メタデータ",
    baseline: "BM25 + embedding検索",
    evaluation: "検索再現率、根拠文書の正確性、回答の引用率",
    keywords: ["rag", "retrieval", "embedding", "document", "patent", "technical report", "qa"],
  },
];

export function getManufacturingGuideArticles(guide: ManufacturingGuide, articles: Article[], limit?: number): Article[] {
  const matched = articles
    .filter((article) => matchesKeywords(article, guide.keywords))
    .sort((a, b) => getManufacturingFitScore(b) - getManufacturingFitScore(a) || b.publishedAt.localeCompare(a.publishedAt));
  return typeof limit === "number" ? matched.slice(0, limit) : matched;
}
