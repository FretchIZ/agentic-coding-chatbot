from typing import Dict, Any, Callable, List
from pydantic import BaseModel
from tools.file_tools import file_tool
from tools.code_tools import code_tool
from tools.search_tools import search_tool


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]
    function: Callable


TOOLS = {
    "read_file": ToolDefinition(
        name="read_file",
        description="Read a file from the workspace",
        parameters={
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Relative path to file"}},
            "required": ["path"]
        },
        function=lambda args: file_tool.read(args["path"]),
    ),
    "write_file": ToolDefinition(
        name="write_file",
        description="Write content to a file in the workspace",
        parameters={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path to file"},
                "content": {"type": "string", "description": "Content to write"}
            },
            "required": ["path", "content"]
        },
        function=lambda args: file_tool.write(args["path"], args["content"]),
    ),
    "list_files": ToolDefinition(
        name="list_files",
        description="List files in a directory",
        parameters={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path to directory", "default": "."},
                "recursive": {"type": "boolean", "description": "List recursively", "default": False}
            }
        },
        function=lambda args: file_tool.list(args.get("path", "."), args.get("recursive", False)),
    ),
    "execute_code": ToolDefinition(
        name="execute_code",
        description="Execute code in Python, JavaScript, or Bash",
        parameters={
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Code to execute"},
                "language": {"type": "string", "description": "Language: python, javascript, bash", "default": "python"},
                "timeout": {"type": "integer", "description": "Timeout in seconds", "default": 30}
            },
            "required": ["code"]
        },
        function=lambda args: code_tool.execute(args["code"], args.get("language", "python"), args.get("timeout", 30)),
    ),
    "search_code": ToolDefinition(
        name="search_code",
        description="Search for code patterns in the workspace using regex",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query (regex)"},
                "path": {"type": "string", "description": "Relative path to search in", "default": "."},
                "file_pattern": {"type": "string", "description": "Glob pattern for files", "default": "*"},
                "case_sensitive": {"type": "boolean", "description": "Case sensitive search", "default": False}
            },
            "required": ["query"]
        },
        function=lambda args: search_tool.search(
            args["query"],
            args.get("path", "."),
            args.get("file_pattern", "*"),
            args.get("case_sensitive", False)
        ),
    ),
}


def get_tool_definitions() -> List[Dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": name,
                "description": tool.description,
                "parameters": tool.parameters
            }
        }
        for name, tool in TOOLS.items()
    ]


def execute_tool(name: str, arguments: Dict[str, Any]) -> Any:
    if name in TOOLS:
        return TOOLS[name].function(arguments)
    raise ValueError(f"Unknown tool: {name}")