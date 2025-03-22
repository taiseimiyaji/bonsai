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

# BuildKitの秘密マウントでシークレットをファイルとしてマウント
RUN --mount=type=secret,id=DATABASE_URL,dst=/run/secrets/DATABASE_URL \
    sh -c 'DATABASE_URL=$(cat /run/secrets/DATABASE_URL) && \
           echo "Using build-time DATABASE_URL with length: ${#DATABASE_URL}" && \
           cp prisma/schema.build.prisma prisma/schema.prisma && \
           npm ci && \
           npm run build'

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

# ビルド時のダミー値をリセット（ランタイムでは Cloud Run の環境変数で上書きされる）
RUN --mount=type=secret,id=DATABASE_URL,env=DATABASE_URL \
    sh -c 'if [ -z "$DATABASE_URL" ]; then echo "DATABASE_URL is empty"; exit 1; fi && \
           echo "DATABASE_URL length: ${#DATABASE_URL}" && \
           cp prisma/schema.build.prisma prisma/schema.prisma && \
           npm ci && \
           npm run build'

# Builder ステージから必要なファイルをコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# production 用の依存関係を再インストール（必要に応じて）
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 8080

# prisma フォルダのコピー
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
