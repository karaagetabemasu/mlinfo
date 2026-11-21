// Browser-only display preference. No translation service or network request.
const languageKey='mlinfo_display_language_v1';
const words={
 '機械学習':'Machine learning','深層学習':'Deep learning','自然言語処理':'Natural language processing','コンピュータビジョン':'Computer vision','強化学習':'Reinforcement learning','生成AI':'Generative AI','数学・理論':'Mathematics and theory','配合最適化':'Formulation optimization','品質予測':'Quality prediction','異常検知':'Anomaly detection','材料探索':'Materials discovery','画像検査':'Visual inspection','文書検索':'Document search',
 '本文へ':'Skip to content','製造業AI':'Manufacturing AI','トピック':'Topics','新着':'Latest','比較':'Compare','保存':'Save','保存済み':'Saved','検索':'Search','プライバシー':'Privacy','解析設定':'Analytics settings','許可する':'Allow','許可しない':'Decline',
 'あなたの課題はどれ？':'What are you working on?','カテゴリから探す':'Browse categories','新着・実装判断カード':'Latest research and implementation notes','すべて見る →':'View all →','実装リンクあり':'Code available','原典を読む ↗':'Read the source ↗','用途':'Use case','難易度の目安':'Estimated difficulty','実装コストの目安':'Estimated implementation cost','原典で確認':'Check the source','初級':'Beginner','中級':'Intermediate','上級':'Advanced','概要':'Abstract','参考リンク':'Resources','実装を始めるプロンプト':'Implementation prompt','プロンプトをコピー':'Copy prompt','関連する記事':'Related articles','保存を解除':'Remove bookmark','バックアップを保存':'Export bookmarks','バックアップを読み込む':'Import bookmarks','さらに表示':'Show more','すべてのソース':'All sources',
 'コピーしました':'Copied','コピーできませんでした。本文を選択してコピーしてください。':'Could not copy. Select the text and copy it manually.',
 'キーワードを入力してください。':'Enter a keyword.','検索しています…':'Searching…','一致する記事はありません。別のキーワードをお試しください。':'No matching articles. Try another keyword.',
 'まだ保存した記事はありません。':'No saved articles yet.','保存した記事':'Saved articles','記事を検索':'Search articles',
 '自社のExcel・CSVデータで試すための、論文・実装・最初の一歩。':'Research, code, and first steps for working with your own Excel and CSV data.',
 '参考リンクを確認したうえで、次の内容をコピーして利用できます。':'Review the resources before copying and using this prompt.',
 'リンク先のライセンス・再現性・データ条件をご確認ください。自動分類や実装の目安は保証ではありません。':'Check the licenses, reproducibility, and data requirements. Automated classifications and implementation estimates are not guarantees.',
 '公開情報をもとにした技術紹介。採用前に原典・実装・利用条件をご確認ください。':'Technical information based on public sources. Check the original work, code, and terms before using it.',
 '利用状況の改善にGoogle Analyticsを使用します。許可するまで解析スクリプトを読み込みません。':'We use Google Analytics to understand usage. Analytics scripts load only with your permission.'
};
export function displayLanguage(){try{return localStorage.getItem(languageKey)==='en'?'en':'ja';}catch{return document.documentElement.lang==='en'?'en':'ja';}}
const original=new WeakMap();
const originals=new WeakMap();
let applying=false;
export function applyLanguage(){if(applying)return;applying=true;try{const lang=displayLanguage();document.documentElement.lang=lang;
 document.querySelectorAll('[data-en]').forEach(el=>{if(!originals.has(el))originals.set(el,el.textContent);const value=lang==='en'?el.getAttribute('data-en'):originals.get(el);if(value!==null&&el.textContent!==value)el.textContent=value;el.setAttribute('lang',lang);});
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){const parent=node.parentElement;if(!parent||parent.closest('script,style,pre,code,[data-en],[data-language-toggle],#language-notice'))continue;if(!original.has(node))original.set(node,node.textContent);const base=original.get(node),key=base.trim();let translated=words[key];if(!translated&&/^\d+件中 \d+件を表示$/.test(key))translated=key.replace(/(\d+)件中 (\d+)件を表示/,'Showing $2 of $1 results');if(!translated&&/^\d+件を保存しています。$/.test(key))translated=key.replace(/(\d+)件を保存しています。/,'$1 saved articles');if(!translated)continue;const next=lang==='en'?base.replace(key,translated):base;if(node.textContent!==next)node.textContent=next;if(parent.childElementCount===0)parent.setAttribute('lang',lang);}
 document.querySelectorAll('[data-language-toggle]').forEach(button=>{const label=lang==='en'?'日本語':'English';if(button.textContent!==label)button.textContent=label;button.setAttribute('aria-label',lang==='en'?'日本語に切り替える':'Switch menus and source abstracts to English');});
 document.querySelectorAll('input[name="q"]').forEach(input=>{input.setAttribute('placeholder',lang==='en'?'Search research and articles…':'論文・記事を検索…');input.setAttribute('aria-label',lang==='en'?'Search articles':'記事を検索');});
 const notice=document.querySelector('#language-notice');if(notice)notice.hidden=lang!=='en';
 }finally{applying=false;}}
function startLanguage(){applyLanguage();document.querySelectorAll('[data-language-toggle]').forEach(button=>button.addEventListener('click',()=>{const next=displayLanguage()==='en'?'ja':'en';try{localStorage.setItem(languageKey,next);}catch{document.documentElement.lang=next;}applyLanguage();}));new MutationObserver(()=>applyLanguage()).observe(document.body,{childList:true,characterData:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startLanguage);else startLanguage();
