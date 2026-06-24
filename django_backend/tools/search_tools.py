import re
from pathlib import Path
from typing import List, Dict, Any
from django.conf import settings


class SearchTool:
    def __init__(self):
        self.workspace = Path(settings.WORKSPACE_DIR).resolve()

    def _resolve_path(self, path: str) -> Path:
        target = (self.workspace / path).resolve()
        if not target.is_relative_to(self.workspace):
            raise ValueError(f"Path {path} escapes workspace")
        return target

    def search(self, query: str, path: str = ".", file_pattern: str = "*", case_sensitive: bool = False) -> List[Dict[str, Any]]:
        search_path = self._resolve_path(path)
        if not search_path.exists():
            raise FileNotFoundError(f"Path not found: {path}")

        flags = 0 if case_sensitive else re.IGNORECASE
        pattern = re.compile(query, flags)

        results = []
        for file_path in search_path.rglob(file_pattern):
            if not file_path.is_file():
                continue
            try:
                content = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue

            for i, line in enumerate(content.splitlines(), 1):
                if pattern.search(line):
                    rel_path = file_path.relative_to(self.workspace)
                    results.append({
                        "file": str(rel_path),
                        "line": i,
                        "content": line.strip(),
                        "match": pattern.search(line).group()
                    })

        return results


search_tool = SearchTool()