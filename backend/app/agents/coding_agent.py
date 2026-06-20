from typing import Dict, Any, List, Literal, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field
from app.core.config import get_settings
from app.tools.registry import get_all_tools


class AgentState(BaseModel):
    messages: Annotated[List[Any], add_messages] = Field(default_factory=list)
    session_id: str = ""
    context: Dict[str, Any] = Field(default_factory=dict)
    next: Literal["agent", "tools", "end"] = "agent"


SYSTEM_PROMPT = """You are an expert coding assistant with access to tools for file operations, code execution, and code search.

You can:
1. Read, write, and list files in the workspace
2. Execute code in Python, JavaScript, or Bash
3. Search for patterns in code

When solving coding tasks:
- First explore the codebase to understand the structure
- Write code to files rather than just showing snippets
- Execute code to verify it works
- Use search to find relevant code patterns

Be concise but thorough. Explain your approach before taking action."""


def get_llm():
    settings = get_settings()
    if settings.llm_provider == "anthropic":
        return ChatAnthropic(
            model=settings.llm_model,
            api_key=settings.anthropic_api_key,
            temperature=0.1,
        )
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        temperature=0.1,
    )


def create_agent():
    tools = get_all_tools()
    llm = get_llm().bind_tools(tools)

    def agent_node(state: AgentState) -> Dict[str, Any]:
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + state.messages
        response = llm.invoke(messages)
        return {"messages": [response]}

    def should_continue(state: AgentState) -> Literal["tools", "end"]:
        last_message = state.messages[-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return "end"

    tool_node = ToolNode(tools)

    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
    workflow.add_edge("tools", "agent")

    return workflow.compile()


coding_agent = create_agent()