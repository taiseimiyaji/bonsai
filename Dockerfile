# Node.js の公式イメージ（Debianベース）を利用
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
# OpenSSL 1.1.xを明示的にインストール（Debian/Ubuntuの場合）
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg && \
    echo "deb http://security.debian.org/debian-security bullseye-security main" > /etc/apt/sources.list.d/bullseye-security.list && \
    apt-get update && \
    apt-get install -y libssl1.1 openssl && \
    rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN npm install --production
ENV NODE_ENV production
EXPOSE 8080
COPY prisma/ ./prisma/
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
CMD ["/app/entrypoint.sh"]
