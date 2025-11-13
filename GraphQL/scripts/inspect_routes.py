import sys
from pathlib import Path

# Ensure repo root is on sys.path so GraphQL package can be imported
repo_root = Path(__file__).parent.parent
sys.path.insert(0, str(repo_root))

from GraphQL.app import main as gql_main

app = gql_main.app

for r in app.router.routes:
    print('PATH:', getattr(r, 'path', None), 'NAME:', getattr(r, 'name', None), 'METHODS:', getattr(r, 'methods', None))
