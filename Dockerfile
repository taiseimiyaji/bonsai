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
# --legacy-peer-deps フラグを使用して依存関係の競合を解決
RUN npm install --legacy-peer-deps

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
# ビルド時にモックデータを使用するためのフラグ
ENV NEXT_PHASE phase-production-build
RUN npm run build

# ────────────────────────────── Runner ステージ ──────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# マイグレーションに必要なファイルをコピー
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# 必要なファイルのみをコピー
COPY --from=builder /app/public ./public

# スタンドアロンビルドの場合は.next/standaloneを使用
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# エントリポイントスクリプトを使用してサーバーを起動
ENTRYPOINT ["./entrypoint.sh"]
