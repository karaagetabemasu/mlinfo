export type Saved={id:string;title:string;path:string;source:string;savedAt:string};
const KEY='mlinfo_bookmarks_v2';
export const validID=(id:unknown):id is string=>typeof id==='string'&&/^(arxiv|github|hf|huggingface)-[A-Za-z0-9._-]+$/.test(id);
export function clean(items:unknown):Saved[]{if(!Array.isArray(items)||items.length>1000)throw Error('保存記事は1,000件以内にしてください。');const seen=new Set();return items.map(raw=>{const x=typeof raw==='string'?{id:raw}:raw;if(!x||!validID(x.id)||seen.has(x.id))throw Error('記事IDが不正または重複しています。');seen.add(x.id);return {id:x.id,title:String(x.title||x.id).slice(0,500),path:'/article/'+x.id,source:String(x.source||'').slice(0,30),savedAt:typeof x.savedAt==='string'&&Number.isFinite(Date.parse(x.savedAt))?new Date(x.savedAt).toISOString():''};});}
export function read():Saved[]{return clean(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('mlinfo_bookmarks')||'[]'));}
export function write(items:Saved[]){localStorage.setItem(KEY,JSON.stringify(clean(items)));document.dispatchEvent(new Event('bookmarks-changed'));}
export function text(tag:string,value:string){const n=document.createElement(tag);n.textContent=value;return n;}
