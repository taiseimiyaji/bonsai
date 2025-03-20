#!/bin/sh
# 環境変数の確認用スクリプト
# Cloud Run環境でのデバッグに役立ちます

LOG_FILE="/app/logs/env-check-$(date +%Y%m%d-%H%M%S).log"

echo "環境変数確認: $(date)" > $LOG_FILE
echo "NODE_ENV: $NODE_ENV" >> $LOG_FILE

# データベース関連の環境変数確認
if [ -z "$DATABASE_URL" ]; then
  echo "警告: DATABASE_URL が設定されていません" >> $LOG_FILE
else
  echo "DATABASE_URL: 設定されています" >> $LOG_FILE
  # 実際の値はセキュリティ上ログに出力しない
fi

if [ -z "$DIRECT_URL" ]; then
  echo "警告: DIRECT_URL が設定されていません" >> $LOG_FILE
else
  echo "DIRECT_URL: 設定されています" >> $LOG_FILE
fi

# システム情報
echo "\nシステム情報:" >> $LOG_FILE
echo "ホスト名: $(hostname)" >> $LOG_FILE
echo "ユーザー: $(whoami)" >> $LOG_FILE
echo "ディスク使用量: $(df -h | grep -v tmpfs)" >> $LOG_FILE

# Prisma関連のファイル確認
echo "\nPrisma関連ファイル確認:" >> $LOG_FILE
if [ -d "/app/prisma" ]; then
  echo "prismaディレクトリ: 存在します" >> $LOG_FILE
  ls -la /app/prisma >> $LOG_FILE
else
  echo "警告: prismaディレクトリが見つかりません" >> $LOG_FILE
fi

if [ -f "/app/prisma/schema.prisma" ]; then
  echo "schema.prisma: 存在します" >> $LOG_FILE
else
  echo "警告: schema.prismaファイルが見つかりません" >> $LOG_FILE
fi

if [ -d "/app/prisma/migrations" ]; then
  echo "migrationsディレクトリ: 存在します" >> $LOG_FILE
  ls -la /app/prisma/migrations >> $LOG_FILE
else
  echo "警告: migrationsディレクトリが見つかりません" >> $LOG_FILE
fi

echo "\n環境変数確認完了: $(date)" >> $LOG_FILE
echo "ログファイル: $LOG_FILE"

# 標準出力にも重要な情報を表示
echo "環境変数確認を実行しました。詳細は $LOG_FILE を確認してください。"
if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "警告: 必要な環境変数が設定されていません。"
fi
