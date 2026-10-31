import importlib.util,json,tempfile,unittest
from pathlib import Path
from datetime import date
spec=importlib.util.spec_from_file_location('content_store',Path(__file__).resolve().parents[1]/'scripts/content_store.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def item(n,day='2026-10-20'):
    return {'id':f'arxiv-2610.{n:05}','source':'arxiv','publishedAt':day,'title':'Title','summary':'Summary','abstract':'Text','url':f'https://arxiv.org/abs/2610.{n:05}','category':'machine-learning'}
def policy(**overrides):return {'normal_max_age_days':180,'normal_max_count':3,'important_max_count':2,'important':{},**overrides}
class ContentTests(unittest.TestCase):
    def test_expired_pinned_article_survives(self):
        records={r['id']:m.normalize(r) for r in [item(1,'2020-01-01'),item(2,'2020-01-02'),item(3)]}
        kept,removed=m.choose(records,policy(important={'arxiv-2610.00001':'Foundational paper'}),date(2026,10,26))
        self.assertIn('arxiv-2610.00001',kept);self.assertEqual(removed['arxiv-2610.00002'],'expired')
    def test_count_removes_oldest_and_is_deterministic(self):
        records={r['id']:m.normalize(r) for r in [item(1,'2026-10-01'),item(2,'2026-10-02'),item(3,'2026-10-03'),item(4,'2026-10-04')]}
        kept,removed=m.choose(records,policy(),date(2026,10,26));self.assertEqual(list(removed),['arxiv-2610.00001']);self.assertEqual(len(kept),3)
    def test_missing_pins_fail_instead_of_silently_dropping(self):
        with self.assertRaises(ValueError):m.choose({},policy(important={'arxiv-2610.00001':'Keep'}),date(2026,10,26))
    def test_schema_and_urls(self):
        for value in ['javascript:alert(1)','https://github.com@evil.test/x','https://localhost/x','https://github.com:4430/x']:self.assertEqual(m.url(value),'')
        with self.assertRaises(ValueError):m.normalize({**item(1),'id':'arxiv-../../etc/passwd'})
        with self.assertRaises(ValueError):m.normalize({**item(1),'title':'x'*501})
    def test_malformed_external_tags(self):
        r=m.normalize({**item(1),'title':'</script><img src=x onerror=alert(1)>','tags':{}});self.assertIn('</script>',r['title'])
        # Stored as text. Rendering must escape it; no HTML evaluation occurs in this store.
    def test_dry_run_does_not_delete_or_write_store(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'content').mkdir();(root/'content/retention.json').write_text(json.dumps(policy()));source=root/'input.json';source.write_text(json.dumps({'articles':[item(1)]}))
            m.prepare(source,today=date(2026,10,26),root=root);self.assertFalse((root/'content/articles').exists());self.assertTrue((root/'build/content-report.json').exists())
    def test_sync_preserves_absent_articles_and_produces_registry(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'content').mkdir();(root/'content/retention.json').write_text(json.dumps(policy()));source=root/'input.json';source.write_text(json.dumps({'articles':[item(1),item(2)]}));m.prepare(source,True,date(2026,10,26),root)
            source.write_text(json.dumps({'articles':[item(3)]}));m.prepare(source,True,date(2026,10,26),root)
            self.assertEqual(len(m.read_store(root/'content/articles')),3);self.assertEqual(len(json.loads((root/'content/registry.json').read_text())),3)
    def test_failed_collection_never_replaces_existing_store(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'content').mkdir();(root/'content/retention.json').write_text(json.dumps(policy()));source=root/'input.json';source.write_text(json.dumps({'articles':[item(1)]}));m.prepare(source,True,date(2026,10,26),root);before=(root/'content/articles/arxiv/arxiv-2610.00001.json').read_text()
            source.write_text('{"articles":[]}')
            with self.assertRaises(ValueError):m.prepare(source,True,date(2026,10,26),root)
            self.assertEqual((root/'content/articles/arxiv/arxiv-2610.00001.json').read_text(),before)
if __name__=='__main__':unittest.main()
