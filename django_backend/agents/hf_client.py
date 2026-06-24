import os
import json
from typing import List, Dict, Any, Optional, AsyncGenerator
from django.conf import settings
from huggingface_hub import InferenceClient
import asyncio


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

Be concise but thorough. Explain your approach before taking action.

When you need to use a tool, respond with a JSON object in this format:
{
  "tool_calls": [
    {
      "name": "tool_name",
      "arguments": {"arg1": "value1", "arg2": "value2"}
    }
  ]
}

Only call ONE tool at a time. Wait for the result before calling another tool or responding to the user."""


class HFClient:
    def __init__(self):
        self.token = settings.HF_TOKEN
        self.model = settings.HF_MODEL
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.token:
            self.client = InferenceClient(
                model=self.model,
                token=self.token,
                timeout=120
            )

    def _format_messages(self, messages: List[Dict[str, Any]]) -> str:
        formatted = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                formatted += f"<|system|>\n{content}\n"
            elif role == "user":
                formatted += f"<|user|>\n{content}\n"
            elif role == "assistant":
                formatted += f"<|assistant|>\n{content}\n"
            elif role == "tool":
                formatted += f"<|tool|>\n{content}\n"
        formatted += "<|assistant|>\n"
        return formatted

    def chat(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.client:
            return {"content": "Error: HF_TOKEN not configured", "tool_calls": []}

        prompt = self._format_messages(messages)
        
        try:
            response = self.client.text_generation(
                prompt,
                max_new_tokens=2048,
                temperature=0.1,
                top_p=0.9,
                do_sample=True,
                return_full_text=False,
                stop_sequences=["<|user|>", "<|system|>", "<|tool|>"]
            )
            
            return self._parse_response(response)
        except Exception as e:
            return {"content": f"Error: {str(e)}", "tool_calls": []}

    async def chat_stream(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> AsyncGenerator[str, None]:
        if not self.client:
            yield "Error: HF_TOKEN not configured"
            return

        prompt = self._format_messages(messages)
        
        try:
            stream = self.client.text_generation(
                prompt,
                max_new_tokens=2048,
                temperature=0.1,
                top_p=0.9,
                do_sample=True,
                return_full_text=False,
                stop_sequences=["<|user|>", "<|system|>", "<|tool|>"],
                stream=True
            )
            
            full_response = ""
            for chunk in stream:
                if chunk:
                    full_response += chunk
                    yield chunk
                    
        except Exception as e:
            yield f"Error: {str(e)}"

    def _parse_response(self, response: str) -> Dict[str, Any]:
        try:
            if '"tool_calls"' in response or '"name"' in response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    json_str = response[start:end]
                    parsed = json.loads(json_str)
                    if "tool_calls" in parsed:
                        return {"content": "", "tool_calls": parsed["tool_calls"]}
            return {"content": response.strip(), "tool_calls": []}
        except json.JSONDecodeError:
            return {"content": response.strip(), "tool_calls": []}


hf_client = HFClient()