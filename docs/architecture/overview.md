# Architecture Overview

## System Design
- Monorepo with Turborepo build system
- Microservices: API Gateway, AI Agent Service, Web App, Admin Dashboard
- Event-driven communication via WebSockets and message queue

## Data Flow
1. User interacts via Web or Admin frontend
2. Requests routed through Nginx to API Gateway
3. API Gateway handles auth, rate limiting, and routing
4. AI Agent Service processes learning queries through multi-agent orchestration
5. RAG pipeline retrieves context from vector database
6. Responses streamed back via WebSocket

## Technology Stack
- Frontend: Next.js 14 with React 18
- Backend: Express.js with TypeScript
- Database: PostgreSQL 16 with pgvector
- Cache: Redis 7
- AI: OpenAI GPT-4 / Anthropic Claude
- Container: Docker + Docker Compose
- Orchestration: Kubernetes (EKS)
- Infrastructure: Terraform (AWS)
- Monitoring: Prometheus + Grafana