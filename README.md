# codeagent

AI-powered coding agent platform. Multi-agent orchestration for software development.

## Structure

```
codeagent/
├── apps/
│   ├── web/         # Next.js 15 frontend
│   ├── api/         # Backend API
│   └── desktop/     # Electron/Tauri desktop app
├── packages/
│   ├── ui/          # shadcn/ui components
│   ├── auth/        # Authentication
│   ├── ai/          # LLM providers
│   ├── agents/      # Multi-agent system
│   ├── memory/      # Long-term memory
│   ├── terminal/    # Terminal abstraction
│   ├── editor/      # Monaco editor
│   ├── git/         # Git operations
│   ├── search/      # RAG/Search
│   ├── review/      # Code review
│   ├── telemetry/   # Logging
│   ├── shared/      # Shared utilities
│   └── database/    # Prisma schema
├── infrastructure/  # Docker, K8s, Terraform
└── docs/           # Documentation
```

## Quick Start

```bash
pnpm install
pnpm db:generate
pnpm dev
```

## Roadmap

- v1.0: Auth, chat, Monaco editor, file explorer, terminal
- v2.0: Planner, coder, reviewer, tester agents
- v3.0: Multi-agent orchestration, memory, RAG, Git
- v4.0: Team collaboration, deployment, plugins, voice
