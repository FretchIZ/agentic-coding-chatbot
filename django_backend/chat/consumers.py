import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from agents.coding_agent import coding_agent
from .models import Session, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.session_group_name = f"chat_{self.session_id}"
        
        session_exists = await self.check_session_exists()
        if not session_exists:
            await self.close()
            return
        
        await self.channel_layer.group_add(self.session_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.session_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "")
        
        await self.save_user_message(message)
        
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": {
                "role": "user",
                "content": message,
                "type": "text",
            }
        }))
        
        messages = await self.get_session_messages()
        
        async for chunk in coding_agent.run_stream(messages):
            if chunk["type"] == "content":
                await self.send(text_data=json.dumps({
                    "type": "content",
                    "content": chunk["content"]
                }))
            elif chunk["type"] == "tool_call":
                await self.send(text_data=json.dumps({
                    "type": "tool_call",
                    "tool_call": chunk["tool_call"]
                }))
            elif chunk["type"] == "tool_result":
                await self.save_tool_result(chunk["tool_call_id"], chunk["content"], chunk.get("is_error", False))
                await self.send(text_data=json.dumps({
                    "type": "tool_result",
                    "tool_call_id": chunk["tool_call_id"],
                    "content": chunk["content"],
                    "is_error": chunk.get("is_error", False)
                }))
            elif chunk["type"] == "done":
                if chunk["content"]:
                    await self.save_assistant_message(chunk["content"])
                await self.send(text_data=json.dumps({"type": "done"}))

    @database_sync_to_async
    def check_session_exists(self):
        return Session.objects.filter(id=self.session_id).exists()

    @database_sync_to_async
    def save_user_message(self, content):
        session = Session.objects.get(id=self.session_id)
        Message.objects.create(
            session=session,
            role="user",
            content=content,
            type="text",
        )

    @database_sync_to_async
    def save_assistant_message(self, content):
        session = Session.objects.get(id=self.session_id)
        Message.objects.create(
            session=session,
            role="assistant",
            content=content,
            type="text",
        )

    @database_sync_to_async
    def save_tool_result(self, tool_call_id, content, is_error=False):
        session = Session.objects.get(id=self.session_id)
        Message.objects.create(
            session=session,
            role="tool",
            content=content,
            type="tool_result",
            tool_call_id=tool_call_id,
        )

    @database_sync_to_async
    def get_session_messages(self):
        session = Session.objects.get(id=self.session_id)
        return list(session.messages.values("role", "content", "type", "tool_call_id", "tool_name", "metadata"))