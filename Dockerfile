# Node.js の公式イメージ（Debianベース）を利用
FROM node:22-slim AS builder
WORKDIR /app

# libssl1.1を直接インストール
RUN apt-get update && \
    apt-get install -y wget && \
    wget http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    dpkg -i libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm -rf /var/lib/apt/lists/*

# package.json等のコピーと依存関係のインストール
COPY package*.json ./
RUN npm ci

# アプリケーション全体をコピー（.dockerignoreで不要なファイルが除外されている前提）
COPY . .

# ※ビルド時には prisma generate/migrate は実行しない
RUN npm run build

#######################################
# Runnerステージ：ランタイムイメージ
FROM node:22-slim AS runner
WORKDIR /app

# libssl1.1を直接インストール
RUN apt-get update && \
    apt-get install -y wget && \
    wget http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    dpkg -i libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm libssl1.1_1.1.1n-0+deb10u6_$(dpkg --print-architecture).deb && \
    rm -rf /var/lib/apt/lists/*

# 必要なファイルをbuilderステージからコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# production用の依存関係をインストール
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 8080

# prismaフォルダは必ず /app 配下に配置（絶対パスで明示）
COPY prisma /app/prisma

# entrypoint.sh を /app にコピーして実行権限を付与
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
