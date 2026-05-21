import type { Article } from "@/app/data/dummy";
import { getManufacturingFitScore, matchesKeywords } from "@/lib/articleInsights";

export type ManufacturingGuide = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  problem: string;
  searchIntent: string;
  recommendedMethods: string[];
  firstSteps: string[];
  implementationNotes: string[];
  commonDataColumns: string[];
  pitfalls: string[];
  faq: { question: string; answer: string }[];
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
    searchIntent: "「配合最適化 ベイズ最適化」「材料開発 AI 配合」で調べる人が、自社の実験データから次に試す条件を決めるためのページです。",
    recommendedMethods: ["LightGBM / Random Forest", "Gaussian Process", "Bayesian Optimization", "Active Learning", "SHAP"],
    firstSteps: [
      "過去実験を1行1条件のCSVに整え、組成・工程条件・物性値を分けます。",
      "まずLightGBMなどで品質や物性値を予測するベースラインを作ります。",
      "SHAPで効いている因子を確認し、現場知見と矛盾がないか見ます。",
      "ベイズ最適化で次に試す配合候補を数点だけ提案します。",
    ],
    implementationNotes: [
      "最初から複雑なGNNや深層生成モデルに行くより、表形式モデルで物性予測を作る方が失敗しにくいです。",
      "目的変数が複数ある場合は、重み付きスコアや制約付き最適化として扱うと現場の意思決定に近づきます。",
      "候補提案は必ず実験可能範囲、原料制約、安全制約でフィルタしてから使います。",
    ],
    commonDataColumns: ["sample_id", "material_a_ratio", "material_b_ratio", "additive", "temperature", "time", "target_property"],
    pitfalls: [
      "組成比の合計が100%になる制約を無視すると、実験できない候補が出ます。",
      "同じ配合の再測定値をランダムに分割すると、評価が楽観的になります。",
      "外挿領域の候補をそのまま信じると、失敗実験が増えます。",
    ],
    faq: [
      {
        question: "実験データが50件程度でも始められますか？",
        answer: "始められます。まずはLightGBMやGaussian Processで不確実性を見ながら、次の実験候補を数点だけ提案する形が現実的です。",
      },
      {
        question: "GPUは必要ですか？",
        answer: "初期PoCでは不要です。表形式データ、LightGBM、Gaussian Process、SHAPであれば社内PCやColab CPUでも検証できます。",
      },
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
    searchIntent: "「製造業 品質予測 AI」「LightGBM 品質予測」で調べる人が、CSVの工程データから品質リスクを予測するためのページです。",
    recommendedMethods: ["LightGBM", "XGBoost", "Random Forest", "Calibration", "SHAP"],
    firstSteps: [
      "ロットごとに工程条件、検査値、品質結果を横持ちの表にします。",
      "リークしやすい事後情報を除外し、時系列分割で評価します。",
      "LightGBMでベースラインを作り、重要因子をSHAPで確認します。",
      "品質しきい値をもとに、回帰と分類の両方で評価します。",
    ],
    implementationNotes: [
      "まずは品質値を直接予測する回帰と、不良/良品を判定する分類の両方を比較します。",
      "時系列やロット順でデータ分割し、未来データを過去データで予測する評価に近づけます。",
      "SHAPで重要因子を確認し、現場で介入可能な条件かどうかを分けて見ます。",
    ],
    commonDataColumns: ["lot_id", "line_id", "raw_material_lot", "temperature", "pressure", "speed", "inspection_value", "defect_flag"],
    pitfalls: [
      "検査後にしか分からない値を特徴量に入れるとリークになります。",
      "ラインや製品品番を混ぜすぎると、モデルが品番差だけを覚えることがあります。",
      "精度だけでなく、見逃し率と誤アラート率を現場運用に合わせて見る必要があります。",
    ],
    faq: [
      {
        question: "品質予測は分類と回帰のどちらで始めるべきですか？",
        answer: "品質指標が連続値なら回帰、不良判定が目的なら分類です。初期PoCでは両方作り、現場判断に近い方を採用するとよいです。",
      },
      {
        question: "説明可能性はどう確保しますか？",
        answer: "LightGBMとSHAPを組み合わせると、どの工程条件や原料情報が予測に効いたかを説明しやすくなります。",
      },
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
    searchIntent: "「製造業 異常検知 センサデータ」「正常データのみ 異常検知」で調べる人が、工程や設備の監視PoCを始めるためのページです。",
    recommendedMethods: ["Isolation Forest", "One-Class SVM", "AutoEncoder", "Change Point Detection", "Robust Statistics"],
    firstSteps: [
      "まず正常期間を定義し、センサや工程値の欠損・外れ値を整理します。",
      "Isolation ForestなどCPUで動く手法をベースラインにします。",
      "異常スコアの時系列を可視化し、既知トラブル日と照合します。",
      "現場が対応できるしきい値と通知頻度を決めます。",
    ],
    implementationNotes: [
      "教師あり分類ではなく、正常データ中心で始められる手法を優先します。",
      "異常スコアを時系列で可視化し、既知の停止、メンテナンス、品質不良と重ねて確認します。",
      "現場が対応できない頻度でアラートが出るモデルは、精度が高くても運用に乗りません。",
    ],
    commonDataColumns: ["timestamp", "machine_id", "sensor_1", "sensor_2", "operating_mode", "maintenance_event", "defect_flag"],
    pitfalls: [
      "運転モードの違いを無視すると、正常な条件変更を異常として検出します。",
      "センサ欠損や校正ずれを処理しないと、モデルが設備異常ではなくデータ品質を検出します。",
      "異常ラベルが少ない場合、AUCだけでは運用性能を判断しにくいです。",
    ],
    faq: [
      {
        question: "異常ラベルがなくても始められますか？",
        answer: "始められます。Isolation Forest、One-Class SVM、統計的なしきい値などで正常からのズレを見る方法が現実的です。",
      },
      {
        question: "深層学習のAutoEncoderから始めるべきですか？",
        answer: "最初は必須ではありません。まずCPUで動くIsolation Forestやロバスト統計でベースラインを作る方が比較しやすいです。",
      },
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
    searchIntent: "「Materials Informatics 少数データ」「材料探索 AI」「matminer 使い方」で調べる人が、記述子と機械学習で候補を絞るためのページです。",
    recommendedMethods: ["Matminer", "Molecular Descriptors", "GNN", "Active Learning", "Uncertainty Sampling"],
    firstSteps: [
      "材料ID、組成、SMILES、既知物性値を同じ表にそろえます。",
      "matminerや記述子で、まず表形式特徴量を作ります。",
      "LightGBMなどのベースラインとGNN系手法を比較します。",
      "予測値と不確実性から、次に評価する候補を選びます。",
    ],
    implementationNotes: [
      "少数データでは、まず化学・物理的に意味のある記述子を作ることが重要です。",
      "GNNは魅力的ですが、データ数が少ない場合は記述子+LightGBMの方が安定することがあります。",
      "実験値と計算値を混ぜる場合は、測定条件や計算条件の違いをメタデータとして持たせます。",
    ],
    commonDataColumns: ["material_id", "composition", "smiles", "descriptor_1", "descriptor_2", "process_condition", "property_value"],
    pitfalls: [
      "公開データと自社データの測定条件差を無視すると、実験で再現しない候補が出ます。",
      "候補選定を予測値だけで行うと、モデルの不確実性が高い領域を見落とします。",
      "記述子生成の失敗や欠損をそのまま除外すると、候補空間に偏りが出ます。",
    ],
    faq: [
      {
        question: "matminerやSMILESは必須ですか？",
        answer: "対象が無機材料なら組成・結晶由来の記述子、有機分子ならSMILESや分子記述子が有効です。必須ではありませんが、少数データでは強い助けになります。",
      },
      {
        question: "GNNはいつ使うべきですか？",
        answer: "構造情報が重要で、十分なデータまたは事前学習モデルを使える場合に検討します。初期PoCは記述子+表形式MLで比較するのがおすすめです。",
      },
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
    searchIntent: "「外観検査 AI 欠陥検出」「不良画像 少ない 異常検知」で調べる人が、画像検査PoCの始め方を決めるためのページです。",
    recommendedMethods: ["Image Classification", "Object Detection", "Segmentation", "Anomaly Detection", "Few-shot Vision"],
    firstSteps: [
      "良品/不良品、欠陥位置ラベルの有無を確認します。",
      "ラベルが少ない場合は良品学習型の異常検知から試します。",
      "欠陥位置が必要ならセグメンテーション、種類判定なら分類を選びます。",
      "見逃し率を優先して評価し、誤検知とのバランスを調整します。",
    ],
    implementationNotes: [
      "欠陥位置のラベルがない場合は、良品画像だけで学習する異常検知から始めると導入しやすいです。",
      "ラベルがある場合は、分類、物体検出、セグメンテーションのどの粒度が現場に必要かを先に決めます。",
      "精度だけでなく、撮像条件、照明、タクトタイム、見逃し時のリスクを評価に含めます。",
    ],
    commonDataColumns: ["image_path", "product_id", "line_id", "defect_type", "bbox_or_mask", "inspection_result"],
    pitfalls: [
      "撮像条件が変わると、モデルが欠陥ではなく照明差を学習することがあります。",
      "不良画像が少ない状態で通常の分類をすると、見逃しが多くなりやすいです。",
      "現場では誤検知より見逃しが重いケースが多く、評価指標を調整する必要があります。",
    ],
    faq: [
      {
        question: "不良画像が少なくても始められますか？",
        answer: "始められます。良品学習型の異常検知や事前学習モデルの特徴量を使う方法が候補になります。",
      },
      {
        question: "分類・検出・セグメンテーションはどう選びますか？",
        answer: "良否だけでよければ分類、欠陥位置が必要なら検出、欠陥領域の面積や形状まで必要ならセグメンテーションを選びます。",
      },
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
    searchIntent: "「製造業 RAG」「技術文書検索 AI」「実験ノート 検索」で調べる人が、社内ナレッジ検索を安全に始めるためのページです。",
    recommendedMethods: ["Embedding Search", "RAG", "Hybrid Search", "Reranking", "Citation-aware Summaries"],
    firstSteps: [
      "文書を案件、材料、設備、試験条件などのメタデータ付きで整理します。",
      "まず埋め込み検索で、キーワード検索より拾える情報が増えるか確認します。",
      "回答生成より先に、根拠文書を正しく返す検索評価を作ります。",
      "機密情報の保存先とアクセス権限を確認してから展開します。",
    ],
    implementationNotes: [
      "最初から回答生成を目指すより、目的の文書を正しく見つける検索評価を先に作ります。",
      "材料名、設備名、試験名、顧客名などのメタデータを付けると検索精度が上がります。",
      "RAGの回答には根拠文書へのリンクや引用箇所を必ず付けます。",
    ],
    commonDataColumns: ["document_id", "title", "project", "material", "equipment", "date", "body_text", "access_level"],
    pitfalls: [
      "機密文書を外部APIに送る設計は、社内規程や契約上の問題になり得ます。",
      "チャンク分割が粗すぎると根拠がぼやけ、細かすぎると文脈が失われます。",
      "生成回答の自然さだけを見ると、根拠のない回答を見逃します。",
    ],
    faq: [
      {
        question: "RAGは最初から必要ですか？",
        answer: "まずはBM25や埋め込み検索で、必要な文書が見つかるかを評価するのが先です。回答生成はその後で十分です。",
      },
      {
        question: "社内文書を外部APIに送ってもよいですか？",
        answer: "機密区分と契約次第です。PoCでも保存先、送信先、ログ保持、アクセス権限を先に確認してください。",
      },
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
