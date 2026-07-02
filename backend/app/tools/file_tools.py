import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.core.config import get_settings


class FileReadParams(BaseModel):
    path: str = Field(description="Relative path to the file from workspace root")


class FileWriteParams(BaseModel):
    path: str = Field(description="Relative path to the file from workspace root")
    content: str = Field(description="Content to write to the file")


class FileListParams(BaseModel):
    path: str = Field(default=".", description="Relative path to directory from workspace root")
    recursive: bool = Field(default=False, description="Whether to list recursively")


class FileDeleteParams(BaseModel):
    path: str = Field(description="Relative path to the file or directory from workspace root")


class FileTool:
    def __init__(self):
        self.workspace = Path(get_settings().workspace_dir).resolve()
        self.workspace.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, path: str) -> Path:
        # Fix: Prevent path traversal by ensuring the resolved path is within workspace
        target = (self.workspace / path).resolve()
        workspace_str = str(self.workspace.resolve())
        target_str = str(target)
        if not target_str.startswith(workspace_str + os.sep) and target_str != workspace_str:
            raise ValueError(f"Path {path} escapes workspace")
        return target

    def read(self, params: FileReadParams) -> str:
        path = self._resolve_path(params.path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {params.path}")
        if not path.is_file():
            raise ValueError(f"Path is not a file: {params.path}")
        return path.read_text(encoding="utf-8")

    def write(self, params: FileWriteParams) -> str:
        path = self._resolve_path(params.path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(params.content, encoding="utf-8")
        return f"Written to {params.path}"

    def list(self, params: FileListParams) -> List[Dict[str, Any]]:
        path = self._resolve_path(params.path)
        if not path.exists():
            raise FileNotFoundError(f"Directory not found: {params.path}")
        if not path.is_dir():
            raise ValueError(f"Path is not a directory: {params.path}")

        result = []
        if params.recursive:
            for item in path.rglob("*"):
                if item.is_file():
                    rel = item.relative_to(self.workspace)
                    result.append({
                        "path": str(rel),
                        "size": item.stat().st_size,
                        "type": "file"
                    })
                elif item.is_dir():
                    rel = item.relative_to(self.workspace)
                    result.append({
                        "path": str(rel) + "/",
                        "size": 0,
                        "type": "directory"
                    })
        else:
            for item in path.iterdir():
                rel = item.relative_to(self.workspace)
                result.append({
                    "path": str(rel) + ("/" if item.is_dir() else ""),
                    "size": item.stat().st_size if item.is_file() else 0,
                    "type": "directory" if item.is_dir() else "file"
                })
        return result

    def delete(self, params: FileDeleteParams) -> str:
        path = self._resolve_path(params.path)
        if not path.exists():
            raise FileNotFoundError(f"Path not found: {params.path}")
        if path.is_dir():
            # Fix: Use rmdir for empty directories, shutil.rmtree for non-empty
            import shutil
            shutil.rmtree(path)
        else:
            path.unlink()
        return f"Deleted {params.path}"


file_tool = FileTool()
