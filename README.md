# Agentic Coding Chatbot

An AI-powered coding assistant built with LangGraph, FastAPI, and React.

## Features

- **Agentic coding assistant** - Uses LangGraph for multi-step reasoning and tool use
- **File operations** - Read, write, list files in workspace
- **Code execution** - Run Python, JavaScript, and Bash code
- **Code search** - Regex-based search across codebase
- **Real-time streaming** - WebSocket-based chat with tool call visibility
- **Session management** - Multiple chat sessions with persistence

## Architecture

```
agentic-coding-chatbot/
├── backend/                 # FastAPI + LangGraph backend
│   ├── app/
│   │   ├── agents/         # LangGraph agent definitions
│   │   ├── api/            # REST + WebSocket endpoints
│   │   ├── tools/          # Tool implementations (file, code, search)
│   │   ├── models/         # Pydantic models
│   │   └── core/           # Configuration
│   └── pyproject.toml
└── frontend/               # React + TypeScript + Tailwind
    ├── src/
    │   ├── components/     # React components
    │   ├── hooks/          # Custom hooks
    │   └── types/          # TypeScript types
    └── package.json
```

## Quick Start

### Backend

```bash
cd agentic-coding-chatbot/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload
```

### Frontend

```bash
cd agentic-coding-chatbot/frontend
npm install
npm run dev
```

Open http://localhost:3000

## Configuration

Set your LLM provider in `.env`:

```env
LLM_PROVIDER=openai  # or anthropic
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=gpt-4o-mini  # or claude-3-haiku-20240307
```

## Tools Available

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Write content to file |
| `list_files` | List directory contents |
| `execute_code` | Run Python/JS/Bash code |
| `search_code` | Regex search in codebase |

## API Endpoints

- `POST /api/chat` - Send message (HTTP)
- `WS /api/ws/chat/{session_id}` - WebSocket chat
- `GET /api/sessions` - List sessions
- `GET /api/sessions/{id}` - Get session
- `DELETE /api/sessions/{id}` - Delete session