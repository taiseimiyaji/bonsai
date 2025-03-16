# Node.jsの公式イメージをベースに
FROM node:22-alpine AS builder
WORKDIR /app

# 依存関係インストール前に package*.json をコピー
COPY package*.json ./
RUN npm ci

# ソースコード全体をコピー（.dockerignoreに prisma が含まれていないことを確認）
COPY . .

# Prisma Client の生成（スキーマが正しく配置されている前提）
RUN npx prisma generate

# アプリケーションのビルド
RUN npm run build

# runner ステージ
FROM node:22-alpine AS runner
WORKDIR /app

# 必要なランタイム依存パッケージのインストール（ここでは OpenSSL1.1 を追加）
RUN apk add --no-cache openssl1.1-compat

# builder ステージから生成物をコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# 本番環境用依存関係のインストール
RUN npm install --production

# 環境変数の設定
ENV NODE_ENV production

# ポート公開
EXPOSE 8080

# prisma フォルダの中身を確実にコピー
COPY prisma/ ./prisma/

# エントリポイントスクリプトのコピーと実行権限付与
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# コンテナ起動時はエントリポイントスクリプトを実行
CMD ["/app/entrypoint.sh"]
