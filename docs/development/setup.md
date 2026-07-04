# Development Setup

## Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 16 with pgvector
- Redis 7

## Getting Started
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

## Project Structure
```
agentic-coding-chatbot/
  apps/
    api/          - REST API server
    ai-agent/     - AI agent service
    web/          - Next.js web app
    admin/        - Admin dashboard
  packages/
    shared/       - Shared types and utilities
    auth/         - Authentication
    database/     - Prisma schema and client
    vector/       - Vector embeddings
    ai/           - AI models and agents
    rag/          - RAG pipeline
    workflows/    - Agent workflows
    analytics/    - Analytics tracking
    editor/       - Code/markdown editors
    ui/           - React UI components
  infrastructure/ - Docker, K8s, Terraform
```

## Commands
- `npm run dev` - Start all dev servers
- `npm run build` - Build all packages
- `npm run test` - Run tests
- `npm run lint` - Lint all packages
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database