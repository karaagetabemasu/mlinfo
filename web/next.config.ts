import type { NextConfig } from "next";

const securityHeaders = [
  // クリックジャッキング防止
  { key: "X-Frame-Options", value: "DENY" },
  // MIMEタイプスニッフィング防止
  { key: "X-Content-Type-Options", value: "nosniff" },
  // リファラー情報の制限
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 不要なブラウザ機能を無効化
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // DNS プリフェッチ無効化
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // HTTPS接続を強制（1年間ブラウザに記憶させる）
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // 許可するリソースの読み込み元を制限（XSS対策）
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",   // Tailwind のインラインスタイルに必要
      "img-src 'self' data: https:",         // 外部画像（OGP等）を許可
      "font-src 'self'",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
      "frame-ancestors 'none'",             // iframe埋め込みを全拒否
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
