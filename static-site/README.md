# MLinfo static site

Cloudflare Pages Free向けの静的サイトです。SSR、ISR、Functions、オンラインDBを使用しません。現在の `web/` は移行完了まで残します。

## ローカルビルド

Node 22.12以降とPython 3.11以降を用意し、リポジトリの `static-site` を作業ディレクトリにします。

```
npm ci --ignore-scripts --no-audit --no-fund
SITE_URL=https://your-project.pages.dev npm run build
```

収集済みデータを検証・保持ルールで選定し、AstroでHTMLを生成、Pagefindで日本語検索インデックスを生成してから容量検査します。公開するのは `static-site/dist` だけです。`build/`・`content/`・旧 `web/data` は公開しません。

GitHub CIで生成したpackage-lock.jsonを保存し、npm ciで推移的依存も固定します。依存更新時はロックファイルとビルド検証をまとめて更新してください。

## データと削除

- 通常記事は公開日基準で180日・最大3,000件。重要記事は別枠で最大500件。
- `content/retention.json` の `important` へ記事IDと保護理由を追加します。保護したIDが欠落すると処理は失敗します。
- `python3 scripts/content_store.py prepare` はdry-run。原本を書き換えず、`build/content-report.json` に削除予定と検証不合格を出力します。
- `python3 scripts/content_store.py sync --apply` は原本を `content/articles/<source>/<id>.json` に保存し、期限切れ・件数超過を適用します。Git履歴からは消しません。
- 日次更新workflowは取得後にsyncします。取得対象から外れたことだけを理由には削除しません。
- 新しい原本の作成・内容が変わった記事だけを書き換えます。公開URL台帳は `content/registry.json`。
- 原典・概要はプレーンテキストです。HTML/MDXとして評価しません。

## Pagesの設定

支払い方法・有料契約を登録せず、PagesのGit連携でこのリポジトリを選択します。

- Root directory: `static-site`
- Build command: `npm run build`
- Output directory: `dist`
- Node: 22.12以降
- 環境変数 `SITE_URL`: 実際の本番HTTPSオリジン（必須）
- 環境変数 `PUBLIC_GA_MEASUREMENT_ID`: 既存の測定ID。省略すれば解析は無効

有料Workers、R2、D1、Images、Functions、OpenNext/SSR adapterは追加しません。最初にBillingの契約と無料プランを確認してください。旧 `mlinfo.vercel.app` は移管できず、新しいURLになります。

## 公開前に必ず確認

1. 重要記事を選び、初回dry-runの削除予定を確認する。
2. CIでビルドを通し、固定したロックファイルで再現することを確認する。
3. 本番URLを設定してビルドし直す。canonical、sitemap、RSSが新ホストを参照することを確認する。
4. 既存記事、カテゴリ、ガイド、検索、保存、古い保存IDの引継ぎを確認する。
5. 存在しないパスがHTTP404になり、関数実行が発生しないことをPagesで確認する。
6. 本番のCSP・nosniff・frame制限、解析の同意前後の通信を確認する。
7. Vercelからの切替・旧ホストのリダイレクト・Search Consoleの設定を行う。現在のVercelの自動デプロイを止める時期も決める。

ソースは旧Next.jsサイトのカテゴリ・ガイド・トピック・スコア関数をビルド時に再利用しています。UIの構成は静的配信向けに簡素化しました。旧サイトの全フィルター・比較画面と完全な機能同等性を保証していません。

Google Analyticsは同意後のみ読み込みます。検索語・URLのquery/fragmentを送らず、ブックマーク、記事クリック、外部リンク、コピーを計測します。撤回時はGoogleの送信を止めて再読込します。

## 容量検査

`check_static.py`は公開ファイル16,000件以上、20MiB以上の単体ファイル、500MiB超の合計、原本・Functionsの混入、CSP不足、404へのscript追加、記事URL欠損でビルドを失敗させます。検査失敗時に現行サイトを上書きしない運用です。無料枠の上限や脆弱性がなくなることを保証するものではありません。
