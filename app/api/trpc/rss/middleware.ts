/**
 * RSS機能の認証ミドルウェア
 */
import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from "@/app/api/trpc/init";
import './types'; // 型定義をインポート

/**
 * 認証済みユーザーのみ許可するミドルウェア
 */
export const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  // ユーザーのロールを確認（Prismaから直接取得）
  const { prisma } = await import('@/prisma/prisma');
  const user = await prisma.user.findUnique({
    where: { id: ctx.session.userId as string },
    select: { role: true },
  });
  
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.userId as string,
      isAdmin: user?.role === 'ADMIN', // 管理者かどうかをチェック
    },
  });
});

/**
 * 管理者のみ許可するミドルウェア
 */
export const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  // ユーザーのロールを確認（Prismaから直接取得）
  const { prisma } = await import('@/prisma/prisma');
  const user = await prisma.user.findUnique({
    where: { id: ctx.session.userId as string },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'この操作には管理者権限が必要です' 
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.userId as string,
      isAdmin: true,
    },
  });
});

/**
 * 認証済みプロシージャ
 */
export const authenticatedProcedure = publicProcedure.use(isAuthenticated);

/**
 * 管理者用プロシージャ
 */
export const adminProcedure = publicProcedure.use(isAdmin);
