import re
from pathlib import Path
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from app.core.config import get_settings


class SearchParams(BaseModel):
    query: str = Field(description="Search query (regex supported)")
    path: str = Field(default=".", description="Relative path to search in")
    file_pattern: str = Field(default="*", description="Glob pattern for files")
    case_sensitive: bool = Field(default=False)


class SearchTool:
    def __init__(self):
        self.workspace = Path(get_settings().workspace_dir).resolve()

    def _resolve_path(self, path: str) -> Path:
        target = (self.workspace / path).resolve()
        if not target.is_relative_to(self.workspace):
            raise ValueError(f"Path {path} escapes workspace")
        return target

    def search(self, params: SearchParams) -> List[Dict[str, Any]]:
        search_path = self._resolve_path(params.path)
        if not search_path.exists():
            raise FileNotFoundError(f"Path not found: {params.path}")

        flags = 0 if params.case_sensitive else re.IGNORECASE
        pattern = re.compile(params.query, flags)

        results = []
        for file_path in search_path.rglob(params.file_pattern):
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