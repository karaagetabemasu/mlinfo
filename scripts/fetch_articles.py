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
from groq import Groq

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────

OUTPUT_PATH = Path(__file__).parent.parent / "web" / "data" / "articles.json"
USE_CASE_CACHE_PATH = Path(__file__).parent.parent / "web" / "data" / "use_case_cache.json"
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



# ─────────────────────────────────────────────
# タグ抽出（FR-01）
# ─────────────────────────────────────────────

TASK_TAG_KEYWORDS: dict[str, list[str]] = {
    "classification": ["classification", "classifier", "categorization", "recognition"],
    "detection": ["object detection", "detection", "detector", "localization", "bounding box"],
    "generation": ["generation", "generative", "synthesis", "text-to-image", "text-to-video", "image synthesis"],
    "segmentation": ["segmentation", "semantic segmentation", "instance segmentation", "panoptic"],
    "regression": ["regression"],
    "anomaly-detection": ["anomaly detection", "outlier detection", "out-of-distribution"],
    "translation": ["machine translation", "neural machine translation"],
    "summarization": ["summarization", "abstractive summarization", "document summarization"],
    "qa": ["question answering", "visual question", "reading comprehension"],
    "forecasting": ["forecasting", "time series prediction", "demand forecasting"],
    "retrieval": ["information retrieval", "dense retrieval", "document retrieval"],
    "embedding": ["representation learning", "sentence embedding"],
}

MODALITY_TAG_KEYWORDS: dict[str, list[str]] = {
    "image": ["image", "visual", "pixel", "photograph"],
    "text": ["natural language", "text", "language model", "corpus", "document"],
    "audio": ["audio", "speech", "acoustic", "sound"],
    "video": ["video", "action recognition"],
    "tabular": ["tabular", "structured data"],
    "3d": ["point cloud", "3d", "depth estimation", "lidar", "nerf", "gaussian splatting"],
    "multimodal": ["multimodal", "vision-language", "cross-modal", "vision and language"],
    "time-series": ["time series", "time-series"],
}

LEARNING_TAG_KEYWORDS: dict[str, list[str]] = {
    "supervised": ["supervised learning"],
    "unsupervised": ["unsupervised"],
    "semi-supervised": ["semi-supervised"],
    "self-supervised": ["self-supervised", "self supervised", "pretext task"],
    "reinforcement": ["reinforcement learning"],
}

GITHUB_URL_RE = re.compile(r'https://github\.com/[\w.-]+/[\w.-]+')


def extract_tags(text: str) -> dict:
    """テキストからタスク・モダリティ・学習設定タグを抽出する"""
    t = text.lower()
    return {
        "task": [tag for tag, kws in TASK_TAG_KEYWORDS.items() if any(kw in t for kw in kws)],
        "modality": [tag for tag, kws in MODALITY_TAG_KEYWORDS.items() if any(kw in t for kw in kws)],
        "learning": [tag for tag, kws in LEARNING_TAG_KEYWORDS.items() if any(kw in t for kw in kws)],
    }


def extract_github_url(text: str) -> str:
    """abstractからGitHubリポジトリURLを抽出する（論文の公式実装URL取得）"""
    m = GITHUB_URL_RE.search(text)
    return m.group(0).rstrip(".,;)>\"'") if m else ""


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
        # タイムアウト時は1回リトライする
        for attempt in range(2):
            try:
                resp = requests.get(url, timeout=(15, 60))
                resp.raise_for_status()
                break
            except Exception as e:
                print(f"[arXiv] {arxiv_cat} fetch error (attempt {attempt+1}): {e}")
                if attempt == 0:
                    time.sleep(5)
                else:
                    resp = None
        if resp is None:
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
            tags = extract_tags(title + " " + abstract)
            code_url = extract_github_url(abstract)

            articles.append({
                "id": f"arxiv-{arxiv_id}",
                "title": title,
                "summary": summary,
                "abstract": abstract,
                "source": "arxiv",
                "url": safe_url(f"https://arxiv.org/abs/{arxiv_id}"),
                "category": category,
                "subcategory": subcategory,
                "publishedAt": published,
                "hasCode": bool(code_url),
                "codeUrl": code_url if code_url else None,
                "likes_count": 0,
                "tags": tags,
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
            tags = extract_tags(title + " " + abstract)
            code_url = extract_github_url(abstract)

            hf_only.append({
                "id": f"hf-{paper_id}",
                "title": title,
                "summary": summary,
                "abstract": abstract,
                "source": "huggingface",
                "url": arxiv_url,
                "category": category,
                "subcategory": subcategory,
                "publishedAt": published,
                "hasCode": bool(code_url),
                "codeUrl": code_url if code_url else None,
                "likes_count": upvotes,
                "tags": tags,
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
            tags = extract_tags(description + " " + " ".join(topics))

            repo_name = full_name.split("/")[-1]
            title = f"{repo_name} — {description}" if description else repo_name
            summary = description[:200] if description else repo_name

            articles.append({
                "id": f"github-{repo_id}",
                "title": title,
                "summary": summary,
                "abstract": description,
                "source": "github",
                "url": html_url,
                "category": category,
                "subcategory": subcategory,
                "publishedAt": pushed_at,
                "hasCode": True,
                "likes_count": stars,
                "tags": tags,
            })

        print(f"[GitHub] {topic}: {len(articles)} articles so far")
        time.sleep(2)

    return articles


# ─────────────────────────────────────────────
# use_case 生成（Claude API）
# ─────────────────────────────────────────────

USE_CASE_BATCH_SIZE = 20  # 1回のAPI呼び出しで処理する記事数


def load_use_case_cache() -> dict[str, str]:
    """キャッシュファイルからuse_caseを読み込む"""
    if USE_CASE_CACHE_PATH.exists():
        try:
            return json.loads(USE_CASE_CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_use_case_cache(cache: dict[str, str]) -> None:
    USE_CASE_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    USE_CASE_CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def generate_use_cases(articles: list[dict], cache: dict[str, dict]) -> dict[str, dict]:
    """
    キャッシュにない記事についてGroqでuse_caseとsummary_jaを生成する。
    キャッシュ形式: { article_id: { "use_case": str, "summary_ja": str } }
    バッチ処理でAPIリクエスト数を削減。初回は件数が多いので途中保存あり。
    """
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        print("[Groq] GROQ_API_KEY が未設定のためuse_case生成をスキップ")
        return cache

    client = Groq(api_key=api_key)
    # キャッシュにない or summary_jaが未生成の記事を対象とする
    new_articles = [
        a for a in articles
        if a.get("abstract") and (
            a["id"] not in cache or not cache[a["id"]].get("summary_ja")
        )
    ]

    if not new_articles:
        print("[Groq] キャッシュ: 新規記事なし、スキップ")
        return cache

    MAX_PER_RUN = 300
    if len(new_articles) > MAX_PER_RUN:
        print(f"[Groq] {len(new_articles)} 件中、本日は {MAX_PER_RUN} 件を処理します（残りは翌日以降）")
        new_articles = new_articles[:MAX_PER_RUN]
    else:
        print(f"[Groq] {len(new_articles)} 件を処理します")

    for i in range(0, len(new_articles), USE_CASE_BATCH_SIZE):
        batch = new_articles[i:i + USE_CASE_BATCH_SIZE]
        lines = []
        for j, a in enumerate(batch):
            text = (a.get("abstract") or a.get("summary", ""))[:500]
            lines.append(f"{j+1}. タイトル: {a['title']}\n要約: {text}")

        prompt = (
            "以下の機械学習論文・リポジトリについて、各記事ごとに2つの情報を日本語で生成してください。\n"
            "1) use_case: 「どんな問題を解決するか」を15文字以内で\n"
            "2) summary_ja: 内容を2〜3文の自然な日本語で要約\n\n"
            "以下の形式で番号順に返してください（他の文言は不要）:\n"
            "1. use_case: XXX\n1. summary_ja: XXX\n2. use_case: ...\n\n"
            + "\n\n".join(lines)
        )

        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024,
            )
            response_text = response.choices[0].message.content
            for line in response_text.strip().split("\n"):
                m_uc = re.match(r"^(\d+)\.\s*use_case:\s*(.+)", line.strip())
                m_sj = re.match(r"^(\d+)\.\s*summary_ja:\s*(.+)", line.strip())
                if m_uc:
                    idx = int(m_uc.group(1)) - 1
                    if 0 <= idx < len(batch):
                        aid = batch[idx]["id"]
                        cache.setdefault(aid, {})["use_case"] = m_uc.group(2).strip()
                elif m_sj:
                    idx = int(m_sj.group(1)) - 1
                    if 0 <= idx < len(batch):
                        aid = batch[idx]["id"]
                        cache.setdefault(aid, {})["summary_ja"] = m_sj.group(2).strip()
        except Exception as e:
            print(f"[Groq] バッチ {i//USE_CASE_BATCH_SIZE + 1} エラー: {e}")

        # レート制限対策（30 RPM）
        time.sleep(2)

        # 50件ごとに途中保存
        if (i + USE_CASE_BATCH_SIZE) % 50 == 0:
            save_use_case_cache(cache)

    save_use_case_cache(cache)
    print(f"[Groq] 生成完了、キャッシュ: {len(cache)} 件")
    return cache


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

    # arXivが極端に少ない場合は前回データを保持して中断
    if OUTPUT_PATH.exists():
        try:
            prev = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
            prev_arxiv_count = sum(1 for a in prev["articles"] if a["source"] == "arxiv")
            if prev_arxiv_count > 100 and len(arxiv_articles) < prev_arxiv_count * 0.5:
                print(f"[安全チェック] arXiv取得数が激減 ({prev_arxiv_count}件 → {len(arxiv_articles)}件)。前回データを保持して終了します。")
                return
        except Exception:
            pass

    all_articles = arxiv_articles + hf_articles + github_articles
    all_articles.sort(key=lambda a: a["publishedAt"], reverse=True)

    # use_case・summary_ja生成（Groq API）
    use_case_cache = load_use_case_cache()
    use_case_cache = generate_use_cases(all_articles, use_case_cache)
    for a in all_articles:
        entry = use_case_cache.get(a["id"])
        if isinstance(entry, dict):
            a["use_case"] = entry.get("use_case", "")
            a["summary_ja"] = entry.get("summary_ja", "")
        elif isinstance(entry, str):
            # 旧形式（文字列のみ）との後方互換
            a["use_case"] = entry
            a["summary_ja"] = ""
        else:
            a["use_case"] = ""
            a["summary_ja"] = ""

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
