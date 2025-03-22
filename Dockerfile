# syntax=docker/dockerfile:1.2
# ────────────────────────────── Builder ステージ ──────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# libssl1.1 をインストール
RUN apt-get update && \
    apt-get install -y wget && \
    wget http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    dpkg -i libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm -rf /var/lib/apt/lists/*

# ビルド時用にダミーの DATABASE_URL を設定（最終イメージには残らない）
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=${DATABASE_URL}

# package.json 等のコピーと依存関係のインストール
COPY package*.json ./
RUN npm ci

# アプリケーション全体をコピー（.dockerignoreで不要なファイルが除外されている前提）
COPY . .

# ビルド（Prisma Client の生成と Next.js のビルド）
RUN npm run build

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

# ダミーの DATABASE_URL をリセット
ENV DATABASE_URL=

# builder ステージから必要なファイルをコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# production 用の依存関係を再インストール（※必要に応じて）
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 8080

# prisma フォルダを /app にコピー
COPY prisma /app/prisma

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
