"""Import a collector snapshot without losing articles absent from today's feed."""
from pathlib import Path
import argparse
import shutil
import tempfile
from content_store import ROOT, prepare


def sync(source: Path, root: Path = ROOT):
    current = root / 'web/data/articles.json'
    if source.resolve() == current.resolve():
        raise ValueError('incoming snapshot must be a separate file')
    # Reject bad/empty incoming data before touching the saved article store.
    with tempfile.TemporaryDirectory() as directory:
        staging = Path(directory)
        shutil.copytree(root / 'content', staging / 'content')
        prepare(current, apply=True, root=staging)
        preview = prepare(source, root=staging)
        if len(preview['invalid']) == preview['collected']:
            raise ValueError('incoming snapshot has no valid articles')
    # Bootstrap the last published snapshot before replacing the rolling feed.
    prepare(current, apply=True, root=root)
    report = prepare(source, apply=True, root=root)
    temporary = current.with_suffix('.json.incoming')
    temporary.write_bytes(source.read_bytes())
    temporary.replace(current)
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    report = sync(args.source)
    print(f"Retained {report['retained']} articles; rejected {len(report['invalid'])}; removed {len(report['removed'])}")
