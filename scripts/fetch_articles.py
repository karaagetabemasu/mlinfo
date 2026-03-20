"""
MLinfo データ収集スクリプト
arXiv と Qiita から機械学習関連の記事を取得してカテゴリ分類し、
web/data/articles.json に保存する。
"""

import json
import time
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from pathlib import Path
import requests

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────

OUTPUT_PATH = Path(__file__).parent.parent / "web" / "data" / "articles.json"
JST = timezone(timedelta(hours=9))

# 1回の取得件数（初回は多め、日次更新は少なめにしてもよい）
ARXIV_MAX_RESULTS = 50
QIITA_PER_PAGE = 20

# arXiv カテゴリ → 大カテゴリのマッピング
ARXIV_CATEGORY_MAP = {
    "cs.LG": "machine-learning",
    "stat.ML": "machine-learning",
    "cs.AI": "machine-learning",
    "cs.NE": "deep-learning",
    "cs.CL": "nlp",
    "cs.CV": "computer-vision",
    "cs.RO": "reinforcement-learning",
    "cs.GT": "reinforcement-learning",
}

# キーワードによるサブカテゴリ分類
SUBCATEGORY_KEYWORDS = {
    # 深層学習
    "transformer": ["transformer", "attention mechanism", "self-attention", "bert", "vit"],
    "cnn": ["convolutional", "cnn", "resnet", "efficientnet"],
    "rnn": ["recurrent", "lstm", "gru", "rnn"],
    "gnn": ["graph neural", "gnn", "graph convolutional"],
    "attention": ["cross-attention", "multi-head attention"],
    "normalization": ["batch norm", "layer norm", "dropout", "weight decay", "adam", "sgd"],
    "efficient": ["quantization", "pruning", "distillation", "lightweight", "efficient"],
    # NLP
    "llm": ["large language model", "llm", "gpt", "llama", "mistral", "claude", "gemini"],
    "rag": ["retrieval-augmented", "rag", "retrieval augmented"],
    "fine-tuning": ["fine-tuning", "fine-tune", "lora", "qlora", "instruction tuning", "sft"],
    "prompt": ["prompt engineering", "chain-of-thought", "few-shot", "zero-shot", "in-context"],
    "embedding": ["embedding", "sentence-bert", "dense retrieval"],
    # CV
    "detection": ["object detection", "yolo", "detr", "faster rcnn", "bounding box"],
    "segmentation": ["segmentation", "sam", "mask", "semantic segmentation"],
    "classification": ["image classification", "imagenet"],
    "3d": ["point cloud", "3d", "nerf", "gaussian splatting"],
    "video": ["video understanding", "action recognition", "temporal"],
    "multimodal": ["multimodal", "vision-language", "clip", "blip", "vlm"],
    # 生成AI
    "diffusion": ["diffusion", "ddpm", "score matching", "denoising", "stable diffusion"],
    "gan": ["generative adversarial", "gan", "discriminator"],
    "vae": ["variational autoencoder", "vae", "latent space"],
    "image-gen": ["image generation", "text-to-image", "dalle", "midjourney"],
    "video-gen": ["video generation", "text-to-video", "sora"],
    "audio-gen": ["audio generation", "music generation", "tts", "speech synthesis"],
    # 強化学習
    "model-free": ["dqn", "sac", "td3", "q-learning", "model-free"],
    "ppo": ["ppo", "proximal policy", "a3c", "policy gradient", "actor-critic"],
    "model-based": ["model-based", "world model", "dreamer"],
    "rlhf": ["rlhf", "human feedback", "reward model", "constitutional ai"],
    "multi-agent": ["multi-agent", "cooperative", "competitive"],
    # 機械学習
    "supervised": ["supervised learning", "classification", "regression", "xgboost", "lightgbm"],
    "unsupervised": ["unsupervised", "clustering", "k-means", "pca"],
    "semi-supervised": ["semi-supervised", "self-supervised", "contrastive"],
    "ensemble": ["ensemble", "random forest", "gradient boosting", "bagging", "boosting"],
    "feature": ["feature engineering", "feature selection", "shap", "feature importance"],
    "tabular": ["tabular", "structured data", "lightgbm", "xgboost", "catboost"],
    "timeseries": ["time series", "forecasting", "temporal", "sequence"],
    "anomaly": ["anomaly detection", "outlier", "one-class"],
    # MLOps
    "experiment": ["experiment tracking", "mlflow", "wandb", "experiment management"],
    "deployment": ["model deployment", "serving", "inference", "onnx", "triton"],
    "monitoring": ["model monitoring", "data drift", "concept drift"],
    "pipeline": ["pipeline", "airflow", "kubeflow", "mlpipeline"],
    "data-management": ["data versioning", "dvc", "data management", "feature store"],
    # 数学・理論
    "optimization": ["optimization", "convex", "gradient descent", "convergence"],
    "probability": ["bayesian", "probabilistic", "variational inference", "mcmc"],
    "information-theory": ["information theory", "entropy", "mutual information", "kl divergence"],
    "linear-algebra": ["matrix factorization", "svd", "eigenvalue"],
    "interpretability": ["interpretability", "explainability", "xai", "shap", "lime"],
}

# サブカテゴリ → 大カテゴリのマッピング
SUBCATEGORY_TO_CATEGORY = {
    "transformer": "deep-learning", "cnn": "deep-learning", "rnn": "deep-learning",
    "gnn": "deep-learning", "attention": "deep-learning", "normalization": "deep-learning",
    "efficient": "deep-learning",
    "llm": "nlp", "rag": "nlp", "fine-tuning": "nlp", "prompt": "nlp",
    "embedding": "nlp", "tokenization": "nlp",
    "detection": "computer-vision", "segmentation": "computer-vision",
    "classification": "computer-vision", "3d": "computer-vision",
    "video": "computer-vision", "multimodal": "computer-vision",
    "diffusion": "generative-ai", "gan": "generative-ai", "vae": "generative-ai",
    "image-gen": "generative-ai", "video-gen": "generative-ai", "audio-gen": "generative-ai",
    "model-free": "reinforcement-learning", "ppo": "reinforcement-learning",
    "model-based": "reinforcement-learning", "rlhf": "reinforcement-learning",
    "multi-agent": "reinforcement-learning",
    "supervised": "machine-learning", "unsupervised": "machine-learning",
    "semi-supervised": "machine-learning", "ensemble": "machine-learning",
    "feature": "machine-learning", "tabular": "machine-learning",
    "timeseries": "machine-learning", "anomaly": "machine-learning",
    "experiment": "mlops", "deployment": "mlops", "monitoring": "mlops",
    "pipeline": "mlops", "data-management": "mlops",
    "optimization": "math-theory", "probability": "math-theory",
    "information-theory": "math-theory", "linear-algebra": "math-theory",
    "interpretability": "math-theory",
}


def classify(text: str, default_category: str) -> tuple[str, str]:
    """タイトル+要約のテキストからカテゴリ・サブカテゴリを推定する"""
    text_lower = text.lower()
    for subcategory, keywords in SUBCATEGORY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            category = SUBCATEGORY_TO_CATEGORY.get(subcategory, default_category)
            return category, subcategory
    return default_category, "supervised"


# ─────────────────────────────────────────────
# arXiv 取得
# ─────────────────────────────────────────────

ARXIV_CATEGORIES = list(ARXIV_CATEGORY_MAP.keys())
ARXIV_NS = "http://www.w3.org/2005/Atom"


def fetch_arxiv() -> list[dict]:
    articles = []
    seen_ids = set()

    for arxiv_cat in ARXIV_CATEGORIES:
        url = (
            "https://export.arxiv.org/api/query"
            f"?search_query=cat:{arxiv_cat}"
            f"&sortBy=submittedDate&sortOrder=descending"
            f"&max_results={ARXIV_MAX_RESULTS}"
        )
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
        except Exception as e:
            print(f"[arXiv] {arxiv_cat} fetch error: {e}")
            time.sleep(3)
            continue

        root = ET.fromstring(resp.text)
        default_cat = ARXIV_CATEGORY_MAP[arxiv_cat]

        for entry in root.findall(f"{{{ARXIV_NS}}}entry"):
            raw_id = entry.findtext(f"{{{ARXIV_NS}}}id", "")
            arxiv_id = raw_id.split("/abs/")[-1].split("v")[0]
            if arxiv_id in seen_ids:
                continue
            seen_ids.add(arxiv_id)

            title = (entry.findtext(f"{{{ARXIV_NS}}}title", "") or "").strip().replace("\n", " ")
            summary = (entry.findtext(f"{{{ARXIV_NS}}}summary", "") or "").strip().replace("\n", " ")
            summary = re.sub(r"\s+", " ", summary)
            # 要約を120文字以内に
            short_summary = summary[:120] + "…" if len(summary) > 120 else summary

            published_raw = entry.findtext(f"{{{ARXIV_NS}}}published", "")
            published = published_raw[:10] if published_raw else ""

            category, subcategory = classify(title + " " + summary, default_cat)

            articles.append({
                "id": f"arxiv-{arxiv_id}",
                "title": title,
                "summary": short_summary,
                "source": "arxiv",
                "url": f"https://arxiv.org/abs/{arxiv_id}",
                "category": category,
                "subcategory": subcategory,
                "publishedAt": published,
                "hasCode": False,
            })

        print(f"[arXiv] {arxiv_cat}: {len(articles)} articles so far")
        time.sleep(3)  # arXiv API レート制限対策

    return articles


# ─────────────────────────────────────────────
# Qiita 取得
# ─────────────────────────────────────────────

QIITA_TAGS = [
    ("機械学習", "machine-learning"),
    ("深層学習", "deep-learning"),
    ("自然言語処理", "nlp"),
    ("強化学習", "reinforcement-learning"),
    ("LLM", "nlp"),
    ("PyTorch", "deep-learning"),
    ("Kaggle", "machine-learning"),
]


def fetch_qiita() -> list[dict]:
    articles = []
    seen_ids = set()

    for tag, default_cat in QIITA_TAGS:
        url = (
            f"https://qiita.com/api/v2/items"
            f"?query=tag:{tag}&per_page={QIITA_PER_PAGE}&sort=created"
        )
        try:
            resp = requests.get(url, timeout=30, headers={"User-Agent": "MLinfo/1.0"})
            resp.raise_for_status()
            items = resp.json()
        except Exception as e:
            print(f"[Qiita] {tag} fetch error: {e}")
            time.sleep(2)
            continue

        for item in items:
            item_id = item.get("id", "")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            title = item.get("title", "")
            body = item.get("body", "")
            # 本文冒頭を要約として使う
            plain = re.sub(r"[#\*`\[\]!>]", "", body)[:120].replace("\n", " ").strip()
            summary = plain + "…" if len(plain) >= 120 else plain

            published = (item.get("created_at", "") or "")[:10]
            url_item = item.get("url", "")

            category, subcategory = classify(title + " " + body[:500], default_cat)

            articles.append({
                "id": f"qiita-{item_id}",
                "title": title,
                "summary": summary,
                "source": "qiita",
                "url": url_item,
                "category": category,
                "subcategory": subcategory,
                "publishedAt": published,
                "hasCode": "```" in body,
            })

        print(f"[Qiita] {tag}: {len(articles)} articles so far")
        time.sleep(1)

    return articles


# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────

def main():
    print("=== MLinfo データ取得開始 ===")

    arxiv_articles = fetch_arxiv()
    qiita_articles = fetch_qiita()

    all_articles = arxiv_articles + qiita_articles
    # 新しい順にソート
    all_articles.sort(key=lambda a: a["publishedAt"], reverse=True)

    output = {
        "lastUpdated": datetime.now(JST).isoformat(),
        "articles": all_articles,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n=== 完了: {len(all_articles)} 件を {OUTPUT_PATH} に保存 ===")


if __name__ == "__main__":
    main()
