"""Fail before publication rather than crossing the free-tier budget."""
import gzip,json,sys
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):super().__init__();self.csp='';self.scripts=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='meta' and a.get('http-equiv','').lower()=='content-security-policy':self.csp=a.get('content','')
        if tag=='script':self.scripts.append(a)

def inspect(folder):
    folder=Path(folder);files=[p for p in folder.rglob('*') if p.is_file()];errors=[]
    if len(files)>=16000:errors.append('file budget exceeded (16,000)')
    total=sum(p.stat().st_size for p in files)
    if total>500*1024**2:errors.append('total asset budget exceeded (500 MiB)')
    for p in files:
        rel=p.relative_to(folder);name=str(rel)
        if p.stat().st_size>=20*1024**2:errors.append('oversized file: '+name)
        if any(x in rel.parts for x in ['functions','.git','node_modules','content','data']) or p.name in {'_worker.js','.env','articles.json','use_case_cache.json'}:errors.append('private/dynamic asset: '+name)
        if p.suffix!='.html':continue
        raw=p.read_text();page=Page();page.feed(raw)
        if name=='404.html':
            if page.scripts:errors.append('404 must not load scripts')
            if len(gzip.compress(raw.encode()))>10240:errors.append('404 is too large')
        else:
            if not page.csp:errors.append('missing CSP: '+name)
            if "'unsafe-inline'" in page.csp or "'unsafe-eval'" in page.csp:errors.append('unsafe CSP: '+name)
            limit=100*1024 if name=='index.html' else 60*1024 if name.startswith('article/') else 150*1024
            if len(gzip.compress(raw.encode()))>limit:errors.append('HTML budget exceeded: '+name)
    if not (folder/'404.html').exists():errors.append('missing top-level static 404')
    data=json.loads((ROOT/'build/articles.json').read_text())
    for r in data['articles']:
        if not (folder/'article'/(r['id']+'.html')).exists():errors.append('missing article URL: '+r['id'])
    report={'file_count':len(files),'total_bytes':total,'warning':len(files)>=12000,'errors':errors}
    (ROOT/'build/static-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({**report,'errors':errors[:10]}))
    if errors:raise ValueError('Static publication checks failed')
    return report
if __name__=='__main__':
    try:inspect(sys.argv[1])
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
