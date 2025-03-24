# syntax=docker/dockerfile:1.2
# ────────────────────────────── Base ステージ ──────────────────────────────
FROM node:18-alpine AS base

# ────────────────────────────── Dependencies ステージ ──────────────────────────────
FROM base AS deps
# Install dependencies only when needed
RUN apk add --no-cache libc6-compat openssl
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

# システムの依存関係をインストール
RUN apk add --no-cache \
    openssl \
    libc6-compat

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

# システムの依存関係をインストール
RUN apk add --no-cache \
    vips-dev \
    openssl \
    libc6-compat

RUN npm install --no-save sharp

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# マイグレーションに必要なファイルをコピー
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/scripts ./scripts

# アプリケーションのファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prismaエンジンのパーミッションを設定
RUN chmod -R 755 /app/node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
