import {read,write,validID} from './bookmarks';
declare global{interface Window{dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;}}
const trackingID=import.meta.env.PUBLIC_GA_MEASUREMENT_ID||'';
const consentKey='mlinfo_analytics_consent_v1';
let enabled=false;
export function track(name:string,params:Record<string,string|number>={}){if(enabled)window.gtag?.('event',name,params);}
function enable(){if(enabled||!/^G-[A-Z0-9]+$/.test(trackingID))return;enabled=true;window.dataLayer=window.dataLayer||[];window.gtag=(...args)=>window.dataLayer!.push(args);window.gtag('js',new Date());const ref=(()=>{try{const u=new URL(document.referrer);return u.origin+u.pathname;}catch{return '';}})();window.gtag('config',trackingID,{page_location:location.origin+location.pathname,page_referrer:ref,page_title:document.title,allow_google_signals:false});const script=document.createElement('script');script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(trackingID);script.async=true;document.head.append(script);}
const banner=document.querySelector<HTMLElement>('#consent');
try{if(localStorage.getItem(consentKey)==='yes')enable();else if(!localStorage.getItem(consentKey)&&trackingID&&banner)banner.hidden=false;}catch{if(trackingID&&banner)banner.hidden=false;}
document.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach(b=>b.onclick=()=>{try{localStorage.setItem(consentKey,b.dataset.consent!);}catch{}if(b.dataset.consent==='yes')enable();else {enabled=false;window.gtag?.('consent','update',{analytics_storage:'denied',ad_storage:'denied'});if(window.gtag)location.reload();}if(banner)banner.hidden=true;});
document.querySelectorAll<HTMLButtonElement>('[data-consent-settings]').forEach(b=>b.onclick=()=>{if(banner)banner.hidden=false;});
function paint(){let saved;try{saved=new Set(read().map(x=>x.id));}catch{return;}document.querySelectorAll<HTMLButtonElement>('[data-bookmark]').forEach(b=>{const on=saved.has(b.dataset.id!);b.textContent=on?'保存済み':'保存';b.setAttribute('aria-pressed',String(on));});}
document.querySelectorAll<HTMLButtonElement>('[data-bookmark]').forEach(b=>b.onclick=()=>{try{const id=b.dataset.id;if(!validID(id))return;const items=read(),was=items.some(x=>x.id===id);write(was?items.filter(x=>x.id!==id):[...items,{id,title:b.dataset.title||id,path:'/article/'+id,source:b.dataset.source||'',savedAt:new Date().toISOString()}]);track(was?'bookmark_remove':'bookmark_add',{article_id:id});}catch{alert('保存できません。ブラウザの保存領域または保存件数をご確認ください。');}});
document.addEventListener('bookmarks-changed',paint);paint();
document.querySelectorAll<HTMLAnchorElement>('[data-article-link]').forEach(a=>a.addEventListener('click',()=>track('article_click',{article_id:a.dataset.articleId||''})));
document.querySelectorAll<HTMLAnchorElement>('[data-external]').forEach(a=>a.addEventListener('click',()=>track('external_link_click',{kind:a.dataset.kind||'',article_id:a.dataset.articleId||''})));
document.querySelector<HTMLButtonElement>('[data-copy-prompt]')?.addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText(document.querySelector('#implementation-prompt')?.textContent||'');if(status)status.textContent='コピーしました';track('copy_prompt');}catch{if(status)status.textContent='コピーできませんでした。本文を選択してコピーしてください。';}});
