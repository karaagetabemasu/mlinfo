import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from sync_static_input import sync
from content_store import read_store


def article(number):
    return {'id': f'arxiv-2610.{number:05}', 'source': 'arxiv',
            'publishedAt': datetime.now(timezone.utc).date().isoformat(),
            'title': 'Test', 'url': f'https://arxiv.org/abs/2610.{number:05}'}


class SnapshotSyncTests(unittest.TestCase):
    def setup_root(self, directory, important=None):
        root = Path(directory)
        (root / 'content').mkdir()
        (root / 'web/data').mkdir(parents=True)
        (root / 'content/retention.json').write_text(json.dumps({
            'normal_max_age_days': 180, 'normal_max_count': 3,
            'important_max_count': 2, 'important': important or {}}))
        (root / 'web/data/articles.json').write_text(json.dumps({'articles': [article(1)]}))
        return root

    def test_initial_import_preserves_last_published_articles(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.setup_root(directory)
            incoming = root / 'incoming.json'
            incoming.write_text(json.dumps({'articles': [article(2)]}))
            sync(incoming, root)
            self.assertEqual(set(read_store(root / 'content/articles')),
                             {'arxiv-2610.00001', 'arxiv-2610.00002'})
            self.assertEqual((root / 'web/data/articles.json').read_bytes(), incoming.read_bytes())
            before = {p.relative_to(root): p.read_bytes() for p in (root / 'content').rglob('*.json')}
            sync(incoming, root)
            self.assertEqual(before, {p.relative_to(root): p.read_bytes() for p in (root / 'content').rglob('*.json')})

    def test_bad_incoming_does_not_mutate_published_snapshot_or_store(self):
        for payload in ['{"articles": []}', 'broken json', '{"articles": [{"id": "../../bad"}]}']:
            with self.subTest(payload=payload), tempfile.TemporaryDirectory() as directory:
                root = self.setup_root(directory)
                incoming = root / 'incoming.json'
                incoming.write_text(payload)
                before = (root / 'web/data/articles.json').read_bytes()
                with self.assertRaises(ValueError):
                    sync(incoming, root)
                self.assertEqual(before, (root / 'web/data/articles.json').read_bytes())
                self.assertFalse((root / 'content/articles').exists())

    def test_pinned_article_only_in_previous_snapshot_survives_bootstrap(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.setup_root(directory, {'arxiv-2610.00001': 'Important'})
            incoming = root / 'incoming.json'
            incoming.write_text(json.dumps({'articles': [article(2)]}))
            sync(incoming, root)
            self.assertIn('arxiv-2610.00001', read_store(root / 'content/articles'))

    def test_in_place_import_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.setup_root(directory)
            with self.assertRaises(ValueError):
                sync(root / 'web/data/articles.json', root)
