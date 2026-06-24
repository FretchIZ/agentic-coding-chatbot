import os
from pathlib import Path
from typing import List, Dict, Any
from django.conf import settings


class FileTool:
    def __init__(self):
        self.workspace = Path(settings.WORKSPACE_DIR).resolve()
        self.workspace.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, path: str) -> Path:
        target = (self.workspace / path).resolve()
        if not target.is_relative_to(self.workspace):
            raise ValueError(f"Path {path} escapes workspace")
        return target

    def read(self, path: str) -> str:
        path = self._resolve_path(path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        if not path.is_file():
            raise ValueError(f"Path is not a file: {path}")
        return path.read_text(encoding="utf-8")

    def write(self, path: str, content: str) -> str:
        path = self._resolve_path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return f"Written to {path}"

    def list(self, path: str = ".", recursive: bool = False) -> List[Dict[str, Any]]:
        path = self._resolve_path(path)
        if not path.exists():
            raise FileNotFoundError(f"Directory not found: {path}")
        if not path.is_dir():
            raise ValueError(f"Path is not a directory: {path}")

        result = []
        if recursive:
            for item in path.rglob("*"):
                if item.is_file():
                    rel = item.relative_to(self.workspace)
                    result.append({"path": str(rel), "size": item.stat().st_size, "type": "file"})
                elif item.is_dir():
                    rel = item.relative_to(self.workspace)
                    result.append({"path": str(rel) + "/", "size": 0, "type": "directory"})
        else:
            for item in path.iterdir():
                rel = item.relative_to(self.workspace)
                result.append({
                    "path": str(rel) + ("/" if item.is_dir() else ""),
                    "size": item.stat().st_size if item.is_file() else 0,
                    "type": "directory" if item.is_dir() else "file"
                })
        return result

    def delete(self, path: str) -> str:
        path = self._resolve_path(path)
        if not path.exists():
            raise FileNotFoundError(f"Path not found: {path}")
        if path.is_dir():
            path.rmdir()
        else:
            path.unlink()
        return f"Deleted {path}"


file_tool = FileTool()