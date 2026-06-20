from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, List
import json
import uuid
from app.models.chat import ChatRequest, ChatResponse, ChatMessage, MessageRole, MessageType, SessionState
from app.agents.coding_agent import coding_agent, AgentState
from langchain_core.messages import AIMessage, ToolMessage, BaseMessage, HumanMessage, SystemMessage


router = APIRouter()

sessions: Dict[str, SessionState] = {}


def get_or_create_session(session_id: str = None) -> SessionState:
    if session_id and session_id in sessions:
        return sessions[session_id]
    new_id = session_id or str(uuid.uuid4())
    session = SessionState(session_id=new_id)
    sessions[new_id] = session
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
    return None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session = get_or_create_session(request.session_id)
    
    user_message = ChatMessage(
        role=MessageRole.USER,
        content=request.message,
        type=MessageType.TEXT,
    )
    session.messages.append(user_message)
    
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
    
    sessions[session.session_id] = session
    
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
            request = json.loads(data)
            
            user_message = ChatMessage(
                role=MessageRole.USER,
                content=request.get("message", ""),
                type=MessageType.TEXT,
            )
            session.messages.append(user_message)
            
            await websocket.send_text(json.dumps({
                "type": "message",
                "message": user_message.model_dump(),
            }))
            
            lc_messages = [chat_to_langchain(m) for m in session.messages]
            
            agent_state = AgentState(
                messages=lc_messages,
                session_id=session.session_id,
                context=request.get("context", {}),
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
                                    await websocket.send_text(json.dumps({
                                        "type": "tool_result",
                                        "tool_result": chat_msg.model_dump(),
                                    }))
            
            await websocket.send_text(json.dumps({"type": "done"}))
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "error": str(e),
        }))


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
    return {"status": "deleted"}


@router.get("/sessions")
async def list_sessions():
    return [{"session_id": sid, "message_count": len(s.messages)} for sid, s in sessions.items()]