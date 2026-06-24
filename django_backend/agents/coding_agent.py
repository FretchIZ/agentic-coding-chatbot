from typing import List, Dict, Any, AsyncGenerator
from agents.hf_client import hf_client, SYSTEM_PROMPT
from tools.registry import get_tool_definitions, execute_tool
import json


class CodingAgent:
    def __init__(self):
        self.tools = get_tool_definitions()
        self.max_iterations = 10

    def run(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        conversation = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
        
        for _ in range(self.max_iterations):
            response = hf_client.chat(conversation, self.tools)
            
            if response["tool_calls"]:
                for tool_call in response["tool_calls"]:
                    try:
                        result = execute_tool(tool_call["name"], tool_call["arguments"])
                        tool_result = {
                            "role": "tool",
                            "content": f"Tool {tool_call['name']} result:\n{json.dumps(result, indent=2)}"
                        }
                        conversation.append({"role": "assistant", "content": json.dumps({"tool_calls": [tool_call])}))
                        conversation.append(tool_result)
                    except Exception as e:
                        error_result = {
                            "role": "tool",
                            "content": f"Tool {tool_call['name']} error: {str(e)}"
                        }
                        conversation.append({"role": "assistant", "content": json.dumps({"tool_calls": [tool_call])}))
                        conversation.append(error_result)
                continue
            
            return {"content": response["content"], "messages": conversation[1:]}
        
        return {"content": "Max iterations reached", "messages": conversation[1:]}

    async def run_stream(self, messages: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        conversation = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
        
        for _ in range(self.max_iterations):
            tool_calls_buffer = []
            content_buffer = ""
            in_tool_call = False
            
            async for chunk in hf_client.chat_stream(conversation, self.tools):
                content_buffer += chunk
                
                if '"tool_calls"' in content_buffer or '"name"' in content_buffer:
                    in_tool_call = True
                
                yield {"type": "content", "content": chunk}
            
            parsed = hf_client._parse_response(content_buffer)
            
            if parsed["tool_calls"]:
                for tool_call in parsed["tool_calls"]:
                    yield {"type": "tool_call", "tool_call": tool_call}
                    
                    try:
                        result = execute_tool(tool_call["name"], tool_call["arguments"])
                        tool_result = {
                            "role": "tool",
                            "content": f"Tool {tool_call['name']} result:\n{json.dumps(result, indent=2)}"
                        }
                        conversation.append({"role": "assistant", "content": json.dumps({"tool_calls": [tool_call])}))
                        conversation.append(tool_result)
                        yield {"type": "tool_result", "tool_call_id": tool_call.get("id", ""), "content": str(result)}
                    except Exception as e:
                        error_msg = f"Tool {tool_call['name']} error: {str(e)}"
                        conversation.append({"role": "assistant", "content": json.dumps({"tool_calls": [tool_call])}))
                        conversation.append({"role": "tool", "content": error_msg})
                        yield {"type": "tool_result", "tool_call_id": tool_call.get("id", ""), "content": error_msg, "is_error": True}
                continue
            
            yield {"type": "done", "content": parsed["content"], "messages": conversation[1:]}
            return
        
        yield {"type": "done", "content": "Max iterations reached", "messages": conversation[1:]}
        return


coding_agent = CodingAgent()