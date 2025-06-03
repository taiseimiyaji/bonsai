import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 本番環境では最小限のログ、開発環境では詳細なログ
const logLevel: Prisma.LogLevel[] = process.env.NODE_ENV === 'production' 
  ? ['error', 'warn'] 
  : ['query', 'info', 'warn', 'error'];

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: logLevel,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// データベース接続のステータスをログ出力
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to database');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
  });

console.log('Using Prisma client');
