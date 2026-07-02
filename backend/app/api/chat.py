from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, List, Optional
import json
import uuid
import os
import pickle
from pathlib import Path
from pydantic import BaseModel
from app.models.chat import ChatRequest, ChatResponse, ChatMessage, MessageRole, MessageType, SessionState
from app.agents.coding_agent import coding_agent, AgentState
from langchain_core.messages import AIMessage, ToolMessage, BaseMessage, HumanMessage, SystemMessage
from app.core.config import get_settings


router = APIRouter()

# Fix: Use file-based session persistence
SESSIONS_DIR = Path(get_settings().workspace_dir).parent / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)


def get_session_file(session_id: str) -> Path:
    return SESSIONS_DIR / f"{session_id}.pkl"


def load_session(session_id: str) -> Optional[SessionState]:
    session_file = get_session_file(session_id)
    if session_file.exists():
        try:
            with open(session_file, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            print(f"Failed to load session {session_id}: {e}")
    return None


def save_session(session: SessionState) -> None:
    session_file = get_session_file(session.session_id)
    try:
        with open(session_file, "wb") as f:
            pickle.dump(session, f)
    except Exception as e:
        print(f"Failed to save session {session.session_id}: {e}")


def delete_session_file(session_id: str) -> None:
    session_file = get_session_file(session_id)
    if session_file.exists():
        try:
            session_file.unlink()
        except Exception as e:
            print(f"Failed to delete session file {session_id}: {e}")


def get_or_create_session(session_id: str = None) -> SessionState:
    if session_id:
        session = load_session(session_id)
        if session:
            return session
    new_id = session_id or str(uuid.uuid4())
    session = SessionState(session_id=new_id)
    save_session(session)
    return session


def chat_to_langchain(msg: ChatMessage) -> BaseMessage:
    if msg.role == MessageRole.USER:
        return HumanMessage(content=msg.content)
    elif msg.role == MessageRole.ASSISTANT:
        return AIMessage(content=msg.content)
    elif msg.role == MessageRole.SYSTEM:
        return SystemMessage(content=msg.content)
    elif msg.role == MessageRole.TOOL:
        return ToolMessage(content=msg.content, tool_call_id=msg.tool_call_id or "", name=msg.tool_name or "")
    return HumanMessage(content=msg.content)


def langchain_to_chat(msg: BaseMessage) -> ChatMessage | None:
    if isinstance(msg, AIMessage):
        return ChatMessage(
            role=MessageRole.ASSISTANT,
            content=msg.content or "",
            type=MessageType.TEXT,
        )
    elif isinstance(msg, ToolMessage):
        return ChatMessage(
            role=MessageRole.TOOL,
            content=msg.content,
            type=MessageType.TOOL_RESULT,
            tool_call_id=msg.tool_call_id,
            tool_name=msg.name,
        )
    # Fix: Return a default message for unsupported types
    return ChatMessage(
        role=MessageRole.SYSTEM,
        content="Unsupported message type",
        type=MessageType.TEXT,
    )


# Fix: Add Pydantic model for WebSocket messages
class WSRequest(BaseModel):
    message: str
    context: Dict = {}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session = get_or_create_session(request.session_id)
    
    user_message = ChatMessage(
        role=MessageRole.USER,
        content=request.message,
        type=MessageType.TEXT,
    )
    session.messages.append(user_message)
    save_session(session)
    
    lc_messages = [chat_to_langchain(m) for m in session.messages]
    
    agent_state = AgentState(
        messages=lc_messages,
        session_id=session.session_id,
        context=request.context,
    )
    
    result = await coding_agent.ainvoke(agent_state)
    
    for msg in result["messages"]:
        chat_msg = langchain_to_chat(msg)
        if chat_msg:
            session.messages.append(chat_msg)
    
    last_ai_message = None
    for msg in reversed(result["messages"]):
        chat_msg = langchain_to_chat(msg)
        if chat_msg and chat_msg.role == MessageRole.ASSISTANT:
            last_ai_message = chat_msg
            break
    
    if not last_ai_message:
        last_ai_message = ChatMessage(
            role=MessageRole.ASSISTANT,
            content="I'm not sure how to respond.",
            type=MessageType.TEXT,
        )
    
    save_session(session)
    
    return ChatResponse(
        session_id=session.session_id,
        message=last_ai_message,
        is_complete=True,
    )


@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = get_or_create_session(session_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                # Fix: Validate WebSocket message structure
                request = WSRequest(**json.loads(data))
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "error": f"Invalid message format: {str(e)}",
                }))
                continue
            
            user_message = ChatMessage(
                role=MessageRole.USER,
                content=request.message,
                type=MessageType.TEXT,
            )
            session.messages.append(user_message)
            save_session(session)
            
            await websocket.send_text(json.dumps({
                "type": "message",
                "message": user_message.model_dump(),
            }))
            
            lc_messages = [chat_to_langchain(m) for m in session.messages]
            
            agent_state = AgentState(
                messages=lc_messages,
                session_id=session.session_id,
                context=request.context,
            )
            
            async for chunk in coding_agent.astream(agent_state):
                for node_name, node_output in chunk.items():
                    if node_name == "agent" and "messages" in node_output:
                        for msg in node_output["messages"]:
                            if hasattr(msg, "tool_calls") and msg.tool_calls:
                                for tool_call in msg.tool_calls:
                                    await websocket.send_text(json.dumps({
                                        "type": "tool_call",
                                        "tool_call": {
                                            "id": tool_call["id"],
                                            "name": tool_call["name"],
                                            "arguments": tool_call["args"],
                                        }
                                    }))
                            elif isinstance(msg, AIMessage) and msg.content:
                                chat_msg = langchain_to_chat(msg)
                                if chat_msg:
                                    session.messages.append(chat_msg)
                                    save_session(session)
                                    await websocket.send_text(json.dumps({
                                        "type": "message",
                                        "message": chat_msg.model_dump(),
                                    }))
                    elif node_name == "tools" and "messages" in node_output:
                        for msg in node_output["messages"]:
                            if isinstance(msg, ToolMessage):
                                chat_msg = langchain_to_chat(msg)
                                if chat_msg:
                                    session.messages.append(chat_msg)
                                    save_session(session)
                                    await websocket.send_text(json.dumps({
                                        "type": "tool_result",
                                        "tool_result": chat_msg.model_dump(),
                                    }))
            
            await websocket.send_text(json.dumps({"type": "done"}))
            
    except WebSocketDisconnect:
        save_session(session)
        pass
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "error": str(e),
        }))


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = load_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    delete_session_file(session_id)
    return {"status": "deleted"}


@router.get("/sessions")
async def list_sessions():
    sessions = []
    for session_file in SESSIONS_DIR.glob("*.pkl"):
        try:
            with open(session_file, "rb") as f:
                session = pickle.load(f)
                sessions.append({"session_id": session.session_id, "message_count": len(session.messages)})
        except Exception as e:
            print(f"Failed to load session {session_file}: {e}")
    return sessions
