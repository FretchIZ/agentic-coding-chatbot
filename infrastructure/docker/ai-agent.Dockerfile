FROM node:20-alpine AS base
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai/package.json ./packages/ai/
COPY packages/vector/package.json ./packages/vector/
COPY packages/rag/package.json ./packages/rag/
COPY packages/workflows/package.json ./packages/workflows/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx turbo build --filter=ai-agent...

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
COPY --from=builder /app .
USER nodejs
EXPOSE 8001
ENV NODE_ENV=production
CMD ["node", "apps/ai-agent/dist/server.js"]