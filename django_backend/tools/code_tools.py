import subprocess
import tempfile
import os
from pathlib import Path
from typing import Dict, Any
from django.conf import settings


class CodeTool:
    def __init__(self):
        self.workspace = Path(settings.WORKSPACE_DIR).resolve()

    def execute(self, code: str, language: str = "python", timeout: int = 30) -> Dict[str, Any]:
        if language == "python":
            return self._execute_python(code, timeout)
        elif language == "javascript":
            return self._execute_javascript(code, timeout)
        elif language == "bash":
            return self._execute_bash(code, timeout)
        else:
            return {"error": f"Unsupported language: {language}", "output": "", "exit_code": -1}

    def _execute_python(self, code: str, timeout: int) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, dir=self.workspace) as f:
            f.write(code)
            temp_path = f.name

        try:
            result = subprocess.run(
                ["python", temp_path],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.workspace
            )
            return {"output": result.stdout, "error": result.stderr, "exit_code": result.returncode}
        except subprocess.TimeoutExpired:
            return {"output": "", "error": f"Timeout after {timeout}s", "exit_code": -1}
        except Exception as e:
            return {"output": "", "error": str(e), "exit_code": -1}
        finally:
            try:
                os.unlink(temp_path)
            except:
                pass

    def _execute_javascript(self, code: str, timeout: int) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False, dir=self.workspace) as f:
            f.write(code)
            temp_path = f.name

        try:
            result = subprocess.run(
                ["node", temp_path],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.workspace
            )
            return {"output": result.stdout, "error": result.stderr, "exit_code": result.returncode}
        except subprocess.TimeoutExpired:
            return {"output": "", "error": f"Timeout after {timeout}s", "exit_code": -1}
        except Exception as e:
            return {"output": "", "error": str(e), "exit_code": -1}
        finally:
            try:
                os.unlink(temp_path)
            except:
                pass

    def _execute_bash(self, code: str, timeout: int) -> Dict[str, Any]:
        try:
            result = subprocess.run(
                code,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.workspace
            )
            return {"output": result.stdout, "error": result.stderr, "exit_code": result.returncode}
        except subprocess.TimeoutExpired:
            return {"output": "", "error": f"Timeout after {timeout}s", "exit_code": -1}
        except Exception as e:
            return {"output": "", "error": str(e), "exit_code": -1}


code_tool = CodeTool()