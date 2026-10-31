import fs from 'node:fs';
import path from 'node:path';
import type {Article} from '../../../web/app/data/dummy';
export {categories} from '../../../web/app/data/dummy';
const data=JSON.parse(fs.readFileSync(path.resolve(process.cwd(),'../build/articles.json'),'utf8'));
export const articles:Article[]=data.articles;
export const updated:string=data.lastUpdated;
export const byID=new Map(articles.map(a=>[a.id,a]));
export const summary=(a:Article)=>(a.summary_ja||a.summary||a.abstract||'').replace(/\s+/g,' ').slice(0,220);
export const articleURL=(a:Article)=>'/article/'+encodeURIComponent(a.id);
export const safeJSON=(value:unknown)=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export const pageSize=24;
export function pagesFor<T>(items:T[]){return Array.from({length:Math.max(1,Math.ceil(items.length/pageSize))},(_,i)=>({page:i+1,total:Math.max(1,Math.ceil(items.length/pageSize)),items:items.slice(i*pageSize,(i+1)*pageSize)}));}
