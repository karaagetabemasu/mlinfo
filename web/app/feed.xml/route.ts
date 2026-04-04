import { getArticles } from "@/lib/data";

const BASE_URL = "https://mlinfo.vercel.app";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = getArticles().slice(0, 50);

  const items = articles.map((a) => `
    <entry>
      <id>${BASE_URL}/article/${encodeURIComponent(a.id)}</id>
      <title><![CDATA[${a.title}]]></title>
      <link href="${BASE_URL}/article/${encodeURIComponent(a.id)}" />
      <summary><![CDATA[${a.summary}]]></summary>
      <updated>${a.publishedAt}T00:00:00Z</updated>
      <category term="${escapeXml(a.category)}" />
    </entry>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>MLinfo</title>
  <subtitle>日々更新される機械学習技術をキャッチアップ</subtitle>
  <link href="${BASE_URL}/feed.xml" rel="self" />
  <link href="${BASE_URL}" />
  <id>${BASE_URL}/</id>
  <updated>${new Date().toISOString()}</updated>
  ${items}
</feed>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
