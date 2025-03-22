#!/bin/sh

# 環境変数のログ出力
echo "Starting application with environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "HOSTNAME: $HOSTNAME"

# データベース接続情報が設定されているか確認
if [ -z "$DATABASE_URL" ]; then
  echo "警告: DATABASE_URL が設定されていません"
else
  echo "DATABASE_URL が設定されています"
fi

# サーバーの起動
echo "サーバーを起動します..."
exec node server.js
