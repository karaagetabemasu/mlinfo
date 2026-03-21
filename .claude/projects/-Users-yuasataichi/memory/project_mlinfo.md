---
name: project_mlinfo
description: MLinfo開発状況・今後の方針
type: project
---

MLinfo（https://mlinfo.vercel.app/）は機械学習技術のキャッチアップWebアプリ。

**現在の状態（2026-03-21）**
- Next.js（Web）メインで開発中
- データソース: arXiv、Qiita、Zenn
- GitHub Actions で毎朝8時 JST に自動更新
- デプロイ: Vercel（無料枠）

**今後の方針**
- ブックマーク機能・ログイン機能はユーザーが集まったタイミングで実装予定
- Claude API でカテゴリ分類・翻訳の精度向上（現在はキーワードマッチ＋Google翻訳）
- iOSアプリはv2以降で検討

**Why:** MVPを早くリリースして個人利用で改善を重ねる方針。
**How to apply:** 新機能提案時はMVP優先・ログイン不要の方向で考える。
