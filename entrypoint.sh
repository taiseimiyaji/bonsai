#!/bin/sh
# ランタイムでPrismaクライアント生成とマイグレーションの実行
npx prisma generate
npx prisma migrate deploy

# アプリケーションの起動
exec npm start
