export const prerender=true;
export function GET({site}:{site:URL}){return new Response(`User-agent: *\nAllow: /\nDisallow: /search\nDisallow: /saved\nSitemap: ${new URL('/sitemap.xml',site).href}\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});}
