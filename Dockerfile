# syntax=docker/dockerfile:1.2
# ────────────────────────────── Base ステージ ──────────────────────────────
FROM node:18-alpine AS base

# ────────────────────────────── Dependencies ステージ ──────────────────────────────
FROM base AS deps
# Install dependencies only when needed
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# ────────────────────────────── Builder ステージ ──────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prismaの生成
RUN npx prisma generate

# Next.jsのビルド
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ────────────────────────────── Runner ステージ ──────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルのみをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# スタンドアロンビルドの場合は.next/standaloneを使用
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# サーバーの起動
CMD ["node", "server.js"]
