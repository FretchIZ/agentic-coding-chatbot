from typing import Dict, Any, Callable, List
from pydantic import BaseModel
from langchain_core.tools import BaseTool, StructuredTool
from app.tools.file_tools import file_tool, FileReadParams, FileWriteParams, FileListParams
from app.tools.code_tools import code_tool, CodeExecuteParams
from app.tools.search_tools import search_tool, SearchParams


class ToolDefinition(BaseModel):
    name: str
    description: str
    params_schema: Dict[str, Any]
    function: Callable


def create_file_tools() -> List[StructuredTool]:
    return [
        StructuredTool.from_function(
            func=file_tool.read,
            name="read_file",
            description="Read a file from the workspace",
            args_schema=FileReadParams,
        ),
        StructuredTool.from_function(
            func=file_tool.write,
            name="write_file",
            description="Write content to a file in the workspace",
            args_schema=FileWriteParams,
        ),
        StructuredTool.from_function(
            func=file_tool.list,
            name="list_files",
            description="List files in a directory",
            args_schema=FileListParams,
        ),
    ]


def create_code_tools() -> List[StructuredTool]:
    return [
        StructuredTool.from_function(
            func=code_tool.execute,
            name="execute_code",
            description="Execute code in Python, JavaScript, or Bash",
            args_schema=CodeExecuteParams,
        ),
    ]


def create_search_tools() -> List[StructuredTool]:
    return [
        StructuredTool.from_function(
            func=search_tool.search,
            name="search_code",
            description="Search for code patterns in the workspace using regex",
            args_schema=SearchParams,
        ),
    ]


def get_all_tools() -> List[StructuredTool]:
    tools = []
    tools.extend(create_file_tools())
    tools.extend(create_code_tools())
    tools.extend(create_search_tools())
    return tools


TOOL_DEFINITIONS = {
    "read_file": ToolDefinition(
        name="read_file",
        description="Read a file from the workspace",
        params_schema=FileReadParams.model_json_schema(),
        function=file_tool.read,
    ),
    "write_file": ToolDefinition(
        name="write_file",
        description="Write content to a file in the workspace",
        params_schema=FileWriteParams.model_json_schema(),
        function=file_tool.write,
    ),
    "list_files": ToolDefinition(
        name="list_files",
        description="List files in a directory",
        params_schema=FileListParams.model_json_schema(),
        function=file_tool.list,
    ),
    "execute_code": ToolDefinition(
        name="execute_code",
        description="Execute code in Python, JavaScript, or Bash",
        params_schema=CodeExecuteParams.model_json_schema(),
        function=code_tool.execute,
    ),
    "search_code": ToolDefinition(
        name="search_code",
        description="Search for code patterns in the workspace using regex",
        params_schema=SearchParams.model_json_schema(),
        function=search_tool.search,
    ),
}