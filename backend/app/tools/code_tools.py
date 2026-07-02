import subprocess
import tempfile
import os
import shlex
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.core.config import get_settings


class CodeExecuteParams(BaseModel):
    code: str = Field(description="Code to execute")
    language: str = Field(default="python", description="Language: python, javascript, bash")
    timeout: int = Field(default=30, description="Timeout in seconds")


class CodeTool:
    def __init__(self):
        self.workspace = Path(get_settings().workspace_dir).resolve()

    def execute(self, params: CodeExecuteParams) -> Dict[str, Any]:
        if params.language == "python":
            return self._execute_python(params)
        elif params.language == "javascript":
            return self._execute_javascript(params)
        elif params.language == "bash":
            return self._execute_bash(params)
        else:
            return {"error": f"Unsupported language: {params.language}", "output": "", "exit_code": -1}

    def _execute_python(self, params: CodeExecuteParams) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, dir=self.workspace) as f:
            f.write(params.code)
            temp_path = f.name

        try:
            result = subprocess.run(
                ["python", temp_path],
                capture_output=True,
                text=True,
                timeout=params.timeout,
                cwd=self.workspace
            )
            return {
                "output": result.stdout,
                "error": result.stderr,
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": f"Timeout after {params.timeout}s", "exit_code": -1}
        except Exception as e:
            return {"output": "", "error": str(e), "exit_code": -1}
        finally:
            # Fix: Log cleanup errors
            try:
                os.unlink(temp_path)
            except Exception as e:
                print(f"Failed to clean up temp file {temp_path}: {e}")

    def _execute_javascript(self, params: CodeExecuteParams) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False, dir=self.workspace) as f:
            f.write(params.code)
            temp_path = f.name

        try:
            result = subprocess.run(
                ["node", temp_path],
                capture_output=True,
                text=True,
                timeout=params.timeout,
                cwd=self.workspace
            )
            return {
                "output": result.stdout,
                "error": result.stderr,
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": f"Timeout after {params.timeout}s", "exit_code": -1}
        except Exception as e:
            return {"output": "", "error": str(e), "exit_code": -1}
        finally:
            # Fix: Log cleanup errors
            try:
                os.unlink(temp_path)
            except Exception as e:
                print(f"Failed to clean up temp file {temp_path}: {e}")

    def _execute_bash(self, params: CodeExecuteParams) -> Dict[str, Any]:
        # Fix: Use shell=False and split the command to prevent shell injection
        # Note: This may break multi-command scripts (e.g., "cd /tmp && ls")
        # For security, we disallow shell=True and require users to use explicit commands
        try:
            # Split the command into a list of arguments
            args = shlex.split(params.code)
            if not args:
                return {"output": "", "error": "Empty command", "exit_code": -1}
            result = subprocess.run(
                args,
                shell=False,  # Fix: Disable shell=True to prevent injection
                capture_output=True,
                text=True,
                timeout=params.timeout,
                cwd=self.workspace
            )
            return {
                "output": result.stdout,
                "error": result.stderr,
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": f"Timeout after {params.timeout}s", "exit_code": -1}
        except Exception as e:
            return {"output": "", "error": str(e), "exit_code": -1}


code_tool = CodeTool()
