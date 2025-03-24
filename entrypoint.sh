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
  
  # RUN_MIGRATIONS環境変数がtrueの場合のみマイグレーションを実行
  if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "RUN_MIGRATIONS=true が設定されているため、Prismaマイグレーションを実行します..."
    npx prisma migrate deploy
    
    # マイグレーション結果の確認
    if [ $? -eq 0 ]; then
      echo "マイグレーションが正常に完了しました"
    else
      echo "警告: マイグレーションに失敗しました。アプリケーションは起動しますが、データベースの状態を確認してください"
    fi
  else
    echo "RUN_MIGRATIONS=true が設定されていないため、マイグレーションをスキップします"
  fi
fi

# データベース接続をテスト
if [ -n "$DATABASE_URL" ]; then
  echo "データベース接続をテストします..."
  npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
  
  if [ $? -eq 0 ]; then
    echo "データベース接続テストが成功しました"
  else
    echo "警告: データベース接続テストに失敗しました。環境変数を確認してください"
  fi
fi

# サーバーの起動
echo "サーバーを起動します..."
exec node server.js
