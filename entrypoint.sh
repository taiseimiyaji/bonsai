#!/bin/sh
set -e

# 環境変数の確認スクリプトを実行
/app/check-env.sh

# 環境変数の確認
if [ -z "$DATABASE_URL" ]; then
  echo "エラー: DATABASE_URL 環境変数が設定されていません"
  exit 1
fi

if [ -z "$DIRECT_URL" ]; then
  echo "警告: DIRECT_URL 環境変数が設定されていません"
  # DIRECT_URLはオプションなので、エラー終了はしない
fi

# データベース接続が確立されるまで待機
echo "データベース接続を確認中..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if npx prisma db execute --stdin --url "$DATABASE_URL" <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "データベース接続確立"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "データベース接続を待機中... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "エラー: データベースに接続できませんでした"
  exit 1
fi

# Prismaクライアント生成
echo "Prismaクライアントを生成中..."
npx prisma generate

# マイグレーション実行
echo "データベースマイグレーションを実行中..."
npx prisma migrate deploy

# マイグレーション成功の確認
if [ $? -ne 0 ]; then
  echo "エラー: マイグレーションに失敗しました"
  exit 1
fi

echo "マイグレーション完了"

# マイグレーション成功ログの作成
echo "マイグレーション成功: $(date)" > /app/logs/migration-success.log

# アプリケーションの起動
echo "アプリケーションを起動中..."
exec npm start
