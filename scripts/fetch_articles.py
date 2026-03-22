"""
MLinfo データ収集スクリプト
arXiv・HuggingFace Papers・GitHub Trending から機械学習関連の記事を取得して
カテゴリ分類し、web/data/articles.json に保存する。

利用規約確認済みソース:
  - arXiv: メタデータはCC0（パブリックドメイン）、商用利用OK
  - HuggingFace: 商用利用は原則許可と明記
  - GitHub: 公開APIの商用利用OK
"""

import json
import os
import time
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
import requests
import defusedxml.ElementTree as ET
from deep_translator import GoogleTranslator

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────

OUTPUT_PATH = Path(__file__).parent.parent / "web" / "data" / "articles.json"
JST = timezone(timedelta(hours=9))

ARXIV_MAX_RESULTS = 200
HF_FETCH_DAYS = 7       # HuggingFace: 過去N日分の注目論文
GITHUB_PER_TOPIC = 30   # GitHub: トピックごとの取得件数

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


def safe_url(url: str, allowed_prefixes: tuple = ("https://",)) -> str:
    """httpsで始まるURLのみ許可する。それ以外は空文字を返す。"""
    return url if any(url.startswith(p) for p in allowed_prefixes) else ""


def extract_summary(text: str, max_sentences: int = 2, max_chars: int = 200) -> str:
    """最初のN文を抽出してサマリーとする。文境界で切り、長すぎる場合は文字数で制限。"""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    summary = " ".join(sentences[:max_sentences])
    if len(summary) > max_chars:
        summary = summary[:max_chars].rsplit(" ", 1)[0] + "…"
    return summary or text[:max_chars]


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
            resp = requests.get(url, timeout=(10, 20))
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
            summary = extract_summary(abstract)

            published_raw = entry.findtext(f"{{{ARXIV_NS}}}published", "")
            published = published_raw[:10] if published_raw else ""

            category, subcategory = classify(title + " " + abstract, default_cat)

            articles.append({
                "id": f"arxiv-{arxiv_id}",
                "title": title,
                "summary": summary,
                "abstract": abstract,
                "abstract_ja": None,
                "source": "arxiv",
                "url": safe_url(f"https://arxiv.org/abs/{arxiv_id}"),
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
# HuggingFace Papers 取得
# 利用規約: 商用利用は原則許可と明記
# ─────────────────────────────────────────────

def fetch_huggingface(arxiv_id_map: dict) -> tuple[list[dict], dict]:
    """
    HuggingFace の注目論文を取得する。
    - arXiv既存記事にはupvoteを反映してlikeを更新
    - arXivにない論文は新規エントリとして返す
    戻り値: (新規hf記事リスト, 更新されたarxiv_id_map)
    """
    hf_only = []
    seen_ids = set()
    today = datetime.now(JST).date()

    for days_ago in range(HF_FETCH_DAYS):
        date_str = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        url = f"https://huggingface.co/api/daily_papers?date={date_str}"
        try:
            resp = requests.get(url, timeout=(10, 20), headers={"User-Agent": "MLinfo/1.0"})
            resp.raise_for_status()
            papers = resp.json()
        except Exception as e:
            print(f"[HuggingFace] {date_str} fetch error: {e}")
            time.sleep(1)
            continue

        for item in papers:
            paper = item.get("paper", {})
            paper_id = paper.get("id", "")
            if not paper_id or paper_id in seen_ids:
                continue
            seen_ids.add(paper_id)

            upvotes = paper.get("upvotes", 0)

            # arXiv既存記事のupvoteを更新
            if paper_id in arxiv_id_map:
                arxiv_id_map[paper_id]["likes_count"] = upvotes
                continue

            title = paper.get("title", "").strip()
            abstract = (paper.get("summary", "") or "").strip().replace("\n", " ")
            abstract = re.sub(r"\s+", " ", abstract)
            summary = extract_summary(abstract) if abstract else title
            published = (paper.get("publishedAt", "") or "")[:10]
            arxiv_url = safe_url(f"https://arxiv.org/abs/{paper_id}")
            if not arxiv_url:
                continue

            category, subcategory = classify(title + " " + abstract, "machine-learning")

            hf_only.append({
                "id": f"hf-{paper_id}",
                "title": title,
                "summary": summary,
                "abstract": abstract,
                "abstract_ja": None,
                "source": "huggingface",
                "url": arxiv_url,
                "category": category,
                "subcategory": subcategory,
                "publishedAt": published,
                "hasCode": False,
                "likes_count": upvotes,
            })

        print(f"[HuggingFace] {date_str}: {len(hf_only)} new articles so far")
        time.sleep(1)

    return hf_only, arxiv_id_map


# ─────────────────────────────────────────────
# GitHub Trending 取得
# 利用規約: 公開APIの商用利用OK
# ─────────────────────────────────────────────

GITHUB_ML_TOPICS = [
    ("machine-learning", "machine-learning"),
    ("deep-learning", "deep-learning"),
    ("large-language-model", "nlp"),
    ("computer-vision", "computer-vision"),
    ("reinforcement-learning", "reinforcement-learning"),
    ("mlops", "mlops"),
    ("diffusion-models", "generative-ai"),
    ("pytorch", "deep-learning"),
    ("nlp", "nlp"),
]


def fetch_github_trending() -> list[dict]:
    articles = []
    seen_ids = set()

    github_token = os.environ.get("GITHUB_TOKEN", "")
    headers = {"User-Agent": "MLinfo/1.0", "Accept": "application/vnd.github+json"}
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")

    for topic, default_cat in GITHUB_ML_TOPICS:
        url = (
            f"https://api.github.com/search/repositories"
            f"?q=topic:{topic}+pushed:>{cutoff_date}&sort=stars&order=desc&per_page={GITHUB_PER_TOPIC}"
        )
        try:
            resp = requests.get(url, timeout=(10, 20), headers=headers)
            resp.raise_for_status()
            repos = resp.json().get("items", [])
        except Exception as e:
            print(f"[GitHub] {topic} fetch error: {e}")
            time.sleep(2)
            continue

        for repo in repos:
            repo_id = str(repo.get("id", ""))
            if repo_id in seen_ids:
                continue
            seen_ids.add(repo_id)

            full_name = repo.get("full_name", "")
            description = (repo.get("description") or "").strip()
            html_url = safe_url(repo.get("html_url", ""))
            if not html_url:
                continue

            stars = repo.get("stargazers_count", 0)
            pushed_at = (repo.get("pushed_at") or "")[:10]
            language = repo.get("language") or ""
            topics = repo.get("topics") or []
            category, subcategory = classify(full_name + " " + description + " " + " ".join(topics), default_cat)

            # abstract: 翻訳元テキスト（説明 + 言語 + トピック情報を含める）
            topic_str = ", ".join(topics[:5]) if topics else ""
            abstract = description
            if language:
                abstract += f" Language: {language}."
            if topic_str:
                abstract += f" Topics: {topic_str}."

            articles.append({
                "id": f"github-{repo_id}",
                "title": full_name,
                "summary": description[:200] if description else full_name,  # 翻訳後に上書き
                "abstract": abstract,
                "abstract_ja": None,  # 翻訳後に埋める
                "source": "github",
                "url": html_url,
                "category": category,
                "subcategory": subcategory,
                "publishedAt": pushed_at,
                "hasCode": True,
                "likes_count": stars,
            })

        print(f"[GitHub] {topic}: {len(articles)} articles so far")
        time.sleep(2)

    return articles


# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────

def main():
    print("=== MLinfo データ取得開始 ===")

    # arXivを取得し、ID逆引きマップを作成
    arxiv_articles = fetch_arxiv()
    arxiv_id_map = {a["id"].replace("arxiv-", ""): a for a in arxiv_articles}

    # HuggingFace: arXiv記事のupvoteを更新しつつ、新規論文を取得
    hf_articles, arxiv_id_map = fetch_huggingface(arxiv_id_map)

    # GitHub Trending
    github_articles = fetch_github_trending()

    all_articles = arxiv_articles + hf_articles + github_articles
    all_articles.sort(key=lambda a: a["publishedAt"], reverse=True)

    # 全ソースの英語テキストを翻訳
    # キャッシュ値が元テキストと同一（=未翻訳のまま保存された）場合も再翻訳する
    cache = load_translation_cache()
    def needs_translation(article: dict) -> bool:
        cached = cache.get(article["id"], "")
        if not cached:
            return True
        src = article.get("abstract", article["summary"])[:len(cached)]
        return cached == src  # キャッシュ==原文なら未翻訳
    to_translate = [a for a in all_articles if needs_translation(a)]
    print(f"\n=== 翻訳開始: {len(to_translate)} 件（キャッシュ済み: {len(cache)} 件）===")

    if to_translate:
        BATCH_SIZE = 30
        texts = [a.get("abstract", a["summary"])[:500] for a in to_translate]
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
        if article.get("abstract_ja") is None:
            article["abstract_ja"] = cache.get(article["id"], article["summary"])

    # summary を日本語版に差し替え（一覧で日本語表示）
    for article in all_articles:
        ja = article.get("abstract_ja") or ""
        if ja and ja != article.get("abstract", ""):
            article["summary"] = extract_summary(ja)

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
