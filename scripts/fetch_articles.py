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
from deep_translator import GoogleTranslator

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────

OUTPUT_PATH = Path(__file__).parent.parent / "web" / "data" / "articles.json"
JST = timezone(timedelta(hours=9))

# 1回の取得件数
ARXIV_MAX_RESULTS = 100
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


def load_translation_cache() -> dict[str, str]:
    """既存のarticles.jsonからid→abstract_jaのキャッシュを読み込む"""
    if OUTPUT_PATH.exists():
        with open(OUTPUT_PATH, encoding="utf-8") as f:
            data = json.load(f)
        return {a["id"]: a["abstract_ja"] for a in data.get("articles", []) if a.get("abstract_ja")}
    return {}


def translate_to_ja(text: str) -> str:
    """英語テキストを日本語に翻訳する（失敗時は原文を返す）"""
    try:
        # Google Translateは1回に5000文字まで
        return GoogleTranslator(source="en", target="ja").translate(text[:4500])
    except Exception as e:
        print(f"  翻訳エラー: {e}")
        return text


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
            resp = requests.get(url, timeout=(10, 20))  # (接続タイムアウト, 読み取りタイムアウト)
            resp.raise_for_status()
        except Exception as e:
            print(f"[arXiv] {arxiv_cat} fetch error: {e}")
            time.sleep(1)
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
            abstract = (entry.findtext(f"{{{ARXIV_NS}}}summary", "") or "").strip().replace("\n", " ")
            abstract = re.sub(r"\s+", " ", abstract)
            # 一覧用の短い英語サマリー（翻訳前のフォールバック用）
            summary = abstract[:120] + "…" if len(abstract) > 120 else abstract

            published_raw = entry.findtext(f"{{{ARXIV_NS}}}published", "")
            published = published_raw[:10] if published_raw else ""

            category, subcategory = classify(title + " " + abstract, default_cat)

            articles.append({
                "id": f"arxiv-{arxiv_id}",
                "title": title,
                "summary": summary,
                "abstract": abstract,      # 翻訳用フルアブストラクト
                "abstract_ja": None,       # 翻訳後に埋める
                "source": "arxiv",
                "url": f"https://arxiv.org/abs/{arxiv_id}",
                "category": category,
                "subcategory": subcategory,
                "publishedAt": published,
                "hasCode": False,
                "likes_count": 0,
            })

        print(f"[arXiv] {arxiv_cat}: {len(articles)} articles so far")
        time.sleep(1)

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
            resp = requests.get(url, timeout=(10, 20), headers={"User-Agent": "MLinfo/1.0"})
            resp.raise_for_status()
            items = resp.json()
        except Exception as e:
            print(f"[Qiita] {tag} fetch error: {e}")
            time.sleep(1)
            continue

        for item in items:
            item_id = item.get("id", "")
            if item_id in seen_ids:
                continue
            seen_ids.add(item_id)

            title = item.get("title", "")
            body = item.get("body", "")
            plain = re.sub(r"[#\*`\[\]!>]", "", body).replace("\n", " ").strip()
            plain = re.sub(r"\s+", " ", plain)
            summary = plain[:120] + "…" if len(plain) > 120 else plain
            # Qiitaはすでに日本語なのでそのまま格納（最大1000文字）
            abstract_ja = plain[:1000] + "…" if len(plain) > 1000 else plain

            published = (item.get("created_at", "") or "")[:10]
            url_item = item.get("url", "")
            likes_count = item.get("likes_count", 0)

            category, subcategory = classify(title + " " + body[:500], default_cat)

            articles.append({
                "id": f"qiita-{item_id}",
                "title": title,
                "summary": summary,
                "abstract": plain[:1000],
                "abstract_ja": abstract_ja,
                "source": "qiita",
                "url": url_item,
                "category": category,
                "subcategory": subcategory,
                "publishedAt": published,
                "hasCode": "```" in body,
                "likes_count": likes_count,
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
    all_articles.sort(key=lambda a: a["publishedAt"], reverse=True)

    # 翻訳キャッシュを読み込んで、未翻訳のarXiv記事のみ翻訳する
    cache = load_translation_cache()
    to_translate = [a for a in all_articles if a["source"] == "arxiv" and not cache.get(a["id"])]
    print(f"\n=== 翻訳開始: {len(to_translate)} 件（キャッシュ済み: {len(cache)} 件）===")

    if to_translate:
        # バッチ翻訳（まとめてAPIコール、1件ずつより大幅に高速）
        BATCH_SIZE = 50  # Google Translateのバッチ上限
        texts = [a.get("abstract", a["summary"])[:4500] for a in to_translate]
        translated = []
        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i:i + BATCH_SIZE]
            print(f"  バッチ翻訳: {i+1}〜{min(i+BATCH_SIZE, len(texts))} 件目")
            try:
                results = GoogleTranslator(source="en", target="ja").translate_batch(batch)
                translated.extend(results)
            except Exception as e:
                print(f"  バッチ翻訳エラー: {e} — 原文を使用")
                translated.extend(batch)
            time.sleep(1)

        for article, ja in zip(to_translate, translated):
            article["abstract_ja"] = ja or article["summary"]

    # キャッシュ済みのものを反映
    for article in all_articles:
        if article["source"] == "arxiv" and article.get("abstract_ja") is None:
            article["abstract_ja"] = cache.get(article["id"], article["summary"])

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
