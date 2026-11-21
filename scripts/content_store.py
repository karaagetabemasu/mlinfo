"""Build-time content store. No network or browser-facing API."""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
STORE=ROOT/'content'/'articles'
POLICY=ROOT/'content'/'retention.json'
REPORT=ROOT/'build'/'content-report.json'
ALLOWED={'arxiv.org','export.arxiv.org','github.com','huggingface.co'}
ID=re.compile(r'^(arxiv|github|hf|huggingface)-[A-Za-z0-9._-]+$')

def url(value):
    if not value:return ''
    try:
        p=urlsplit(str(value))
        if p.scheme!='https' or p.hostname not in ALLOWED or p.username or p.password or p.port not in (None,443):return ''
        return str(value)
    except ValueError:return ''

def normalize(raw):
    if not isinstance(raw,dict) or not ID.fullmatch(str(raw.get('id',''))):raise ValueError('invalid article ID')
    if raw.get('source') not in {'arxiv','github','huggingface'}:raise ValueError('invalid source')
    published=str(raw.get('publishedAt',''))[:10]
    date.fromisoformat(published)
    out={'id':raw['id'],'source':raw['source'],'publishedAt':published}
    for key,limit in [('title',500),('summary',600),('abstract',10000),('summary_ja',2000),('abstract_ja',10000),('use_case',300),('category',100),('subcategory',100)]:
        value=raw.get(key,'') or ''
        if not isinstance(value,str) or len(value)>limit:raise ValueError(f'invalid {key}')
        out[key]=value
    if not out['title']:raise ValueError('empty title')
    out['url']=url(raw.get('url'))
    if not out['url']:raise ValueError('invalid source URL')
    out['codeUrl']=url(raw.get('codeUrl'))
    out['hasCode']=bool(raw.get('hasCode'))
    likes=raw.get('likes_count',0) or 0
    out['likes_count']=int(likes) if isinstance(likes,(int,float)) and 0<=likes<=10**9 else 0
    authors=raw.get('authors',[]) or []
    if not isinstance(authors,list):raise ValueError('invalid authors')
    out['authors']=[str(x)[:200] for x in authors[:20]]
    tags=raw.get('tags',{}) or {}
    if not isinstance(tags,dict):raise ValueError('invalid tags')
    out['tags']={k:[str(x)[:80] for x in tags.get(k,[])[:30]] for k in ['task','modality','learning'] if isinstance(tags.get(k,[]),list)}
    blob=json.dumps(out,ensure_ascii=False,sort_keys=True).encode()
    if len(blob)>32768:raise ValueError('article exceeds 32 KiB')
    return out

def choose(records,policy,today):
    pinned=policy.get('important',{})
    if not isinstance(pinned,dict) or len(pinned)>policy['important_max_count']:raise ValueError('important article capacity exceeded')
    if any(not ID.fullmatch(k) or not isinstance(v,str) or not v.strip() for k,v in pinned.items()):raise ValueError('important IDs require reasons')
    missing=set(pinned)-set(records)
    if missing:raise ValueError('important articles missing: '+','.join(sorted(missing)))
    normal=[];removed={};kept={k:v for k,v in records.items() if k in pinned}
    for k,r in records.items():
        if k in pinned:continue
        age=(today-date.fromisoformat(r['publishedAt'])).days
        if age< -1:raise ValueError('future article date')
        if age>policy['normal_max_age_days']:removed[k]='expired'
        else:normal.append(r)
    normal.sort(key=lambda r:(r['publishedAt'],r['id']),reverse=True)
    for i,r in enumerate(normal):
        if i<policy['normal_max_count']:kept[r['id']]=r
        else:removed[r['id']]='count_limit'
    return kept,removed

def read_store(directory):
    records={}
    for f in sorted(directory.glob('*/*.json')):
        r=normalize(json.loads(f.read_text()))
        if f.stem!=r['id'] or f.parent.name!=r['source']:raise ValueError('article path mismatch')
        if r['id'] in records:raise ValueError('duplicate stored ID')
        records[r['id']]=r
    return records

def atomic(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    text=json.dumps(value,ensure_ascii=False,sort_keys=True,indent=2)+'\n'
    if path.exists() and path.read_text()==text:return
    tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(text);tmp.replace(path)

def prepare(source,apply=False,today=None,root=ROOT):
    today=today or datetime.now(timezone.utc).date()
    policy=json.loads((root/'content/retention.json').read_text())
    store=root/'content/articles';old=read_store(store)
    incoming=json.loads(source.read_text())
    if not isinstance(incoming.get('articles'),list) or not incoming['articles']:raise ValueError('empty collection; preserve previous content')
    merged=dict(old);invalid=[]
    for raw in incoming['articles']:
        try:r=normalize(raw);merged[r['id']]=r
        except (ValueError,TypeError) as e:invalid.append({'id':str(raw.get('id',''))[:100] if isinstance(raw,dict) else '', 'reason':str(e)})
    if len(invalid)>max(10,len(incoming['articles'])*.05):raise ValueError('too many invalid records; preserve previous content')
    if not merged:raise ValueError('no valid articles')
    kept,removed=choose(merged,policy,today)
    report={'date':today.isoformat(),'before':len(old),'collected':len(incoming['articles']),'retained':len(kept),'important':len(policy['important']),'removed':removed,'invalid':invalid,'mode':'apply' if apply else 'dry-run'}
    atomic(root/'build/content-report.json',report)
    if apply:
        for r in kept.values():atomic(store/r['source']/(r['id']+'.json'),r)
        for f in store.glob('*/*.json'):
            if f.stem not in kept:f.unlink()
        # Registry is build-only bookkeeping; no per-deleted-article HTML is published.
        registry_path=root/'content/registry.json'
        registry=json.loads(registry_path.read_text()) if registry_path.exists() else {}
        for k in merged:registry[k]={'path':'/article/'+k,'status':'published' if k in kept else 'removed'}
        atomic(registry_path,registry)
    # Only this projection is loaded by the static compiler, never copied wholesale to public/.
    atomic(root/'build/articles.json',{'lastUpdated':incoming.get('lastUpdated',''),'articles':sorted(kept.values(),key=lambda r:(r['publishedAt'],r['id']),reverse=True)})
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['prepare','sync']);p.add_argument('--source',type=Path,default=ROOT/'web/data/articles.json');p.add_argument('--apply',action='store_true');a=p.parse_args()
    try:
        result=prepare(a.source,apply=a.apply)
        print(json.dumps({k:v for k,v in result.items() if k not in {'removed','invalid'}},ensure_ascii=False))
        print('Deletion plan and rejected rows: build/content-report.json')
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
