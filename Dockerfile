# syntax=docker/dockerfile:1.2
# ────────────────────────────── Builder ステージ ──────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# libssl1.1 のインストール
RUN apt-get update && \
    apt-get install -y wget && \
    wget http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    dpkg -i libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm -rf /var/lib/apt/lists/*

# 必要なファイルをコピー
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY public ./public
COPY app ./app
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY types ./types

# ビルド時はダミーのデータベースURLを使用してPrismaがDB接続しないようにする
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=dummy"
ENV DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=dummy"
ENV NODE_ENV="production"

# ビルド前にtrpc-clientファイルの存在確認
RUN ls -la /app/app/api/trpc/

# devDependenciesを含めて全ての依存関係をインストール
RUN npm ci --include=dev && \
    npx prisma generate && \
    npm run build

# ────────────────────────────── Runner ステージ ──────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# libssl1.1 と postgresql-client のインストール
RUN apt-get update && \
    apt-get install -y wget postgresql-client && \
    wget http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    dpkg -i libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm -rf /var/lib/apt/lists/*

# Builder ステージから必要なファイルをコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# production 用の依存関係を再インストールする必要はない
# RUN npm install --production

ENV NODE_ENV=production
EXPOSE 8080

# prisma フォルダのコピー
COPY prisma /app/prisma

# app フォルダのコピー（ランタイムでも必要なファイルがある可能性があるため）
COPY app /app/app

# entrypoint.sh をコピーして実行権限を付与
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# マイグレーションログ用ディレクトリの作成
RUN mkdir -p /app/logs

# 環境変数確認用スクリプトのコピーと権限付与
COPY check-env.sh /app/check-env.sh
RUN chmod +x /app/check-env.sh

# コンテナ起動時に entrypoint.sh を実行
CMD ["/app/entrypoint.sh"]
