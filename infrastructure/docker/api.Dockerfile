FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/auth/package.json ./packages/auth/
COPY packages/database/package.json ./packages/database/
COPY packages/vector/package.json ./packages/vector/
COPY packages/ai/package.json ./packages/ai/
COPY packages/rag/package.json ./packages/rag/
COPY packages/workflows/package.json ./packages/workflows/
COPY packages/analytics/package.json ./packages/analytics/
COPY packages/editor/package.json ./packages/editor/
COPY packages/markdown/package.json ./packages/markdown/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo build --filter=api...

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express
COPY --from=builder /app .
USER express
EXPOSE 8000
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/server.js"]