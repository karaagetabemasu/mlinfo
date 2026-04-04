import Link from "next/link";
import Logo from "@/app/components/Logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | MLinfo",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-8 py-4">
        <Logo />
      </header>

      <div className="px-6 py-12 max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">プライバシーポリシー</h1>
        <p className="text-xs text-zinc-400 mb-10">最終更新日：2026年4月4日</p>

        <div className="space-y-8 text-sm text-zinc-700 leading-relaxed">

          <section>
            <h2 className="font-semibold text-zinc-900 mb-2">1. 運営者</h2>
            <p>本サービス「MLinfo」は個人が運営しています。</p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 mb-2">2. 収集する情報</h2>
            <p>
              本サービスは、氏名・メールアドレス・住所などの個人を特定できる情報を収集しません。
              ただし、以下の情報が自動的に収集される場合があります。
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-zinc-600">
              <li>アクセスログ（IPアドレス、ブラウザ種別、参照元URL等）</li>
              <li>Cookie・ローカルストレージ（既読記事の管理等、本サービスの機能のみに使用）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 mb-2">3. 広告について</h2>
            <p>
              本サービスでは、第三者配信の広告サービスを利用する場合があります。
              広告配信にあたり、広告サービス提供者がCookieを使用してユーザーの行動情報を収集することがあります。
              収集される情報には個人を特定するものは含まれません。
              広告サービス提供者のCookieの使用はブラウザ設定から無効化できます。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 mb-2">4. アクセス解析について</h2>
            <p>
              本サービスでは、サービス改善のためにアクセス解析ツールを利用する場合があります。
              アクセス解析ツールはCookieを使用してアクセス情報を収集しますが、個人を特定するものではありません。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 mb-2">5. 外部リンクについて</h2>
            <p>
              本サービスはarXiv・HuggingFace・GitHubへのリンクを含みます。
              リンク先のプライバシーポリシーについては各サービスにご確認ください。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 mb-2">6. プライバシーポリシーの変更</h2>
            <p>
              本ポリシーは必要に応じて変更することがあります。
              変更後のポリシーは本ページに掲載した時点から効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 mb-2">7. お問い合わせ</h2>
            <p>
              本ポリシーに関するお問い合わせは下記までご連絡ください。
            </p>
            <p className="mt-2">
              <a
                href="mailto:mlinfo.forcontact@gmail.com"
                className="text-zinc-500 underline underline-offset-2 hover:text-zinc-900 transition-colors"
              >
                mlinfo.forcontact@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-zinc-200">
          <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
            ← トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
