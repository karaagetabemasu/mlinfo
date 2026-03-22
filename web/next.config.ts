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
