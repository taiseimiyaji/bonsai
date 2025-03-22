/**
 * RSSフィード関連のプロシージャ
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure } from "@/app/api/trpc/init";
import { authenticatedProcedure, adminProcedure } from './middleware';
import { formatFeed } from './utils';
import { RssApplicationService } from '@/app/types/rss/application/rss-application-service';
import { PrismaRssFeedRepository, PrismaRssArticleRepository } from '@/app/types/rss/infrastructure/prisma-repository';
import './types'; // 型定義をインポート

// リポジトリの初期化
const feedRepository = new PrismaRssFeedRepository();
const articleRepository = new PrismaRssArticleRepository();

// アプリケーションサービスの初期化
const rssService = new RssApplicationService(feedRepository, articleRepository);

/**
 * フィードを追加
 */
export const addFeed = authenticatedProcedure
  .input(z.object({ 
    url: z.string().url('有効なURLを入力してください') 
  }))
  .mutation(async ({ ctx, input }) => {
    const result = await rssService.addFeed(input.url, ctx.userId);
    
    if (!result.ok) {
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: result.error.message 
      });
    }
    
    return formatFeed(result.value);
  });
  
/**
 * 管理者用: 公開フィードを追加
 */
export const addPublicFeed = adminProcedure
  .input(z.object({ 
    url: z.string().url('有効なURLを入力してください') 
  }))
  .mutation(async ({ ctx, input }) => {
    const result = await rssService.addPublicFeed(input.url);
    
    if (!result.ok) {
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: result.error.message 
      });
    }
    
    return formatFeed(result.value);
  });
  
/**
 * フィードを削除
 */
export const deleteFeed = authenticatedProcedure
  .input(z.object({ 
    feedId: z.string().min(1) 
  }))
  .mutation(async ({ ctx, input }) => {
    // フィードの所有者を確認
    const { prisma } = await import('@/prisma/prisma');
    const feed = await prisma.rssFeed.findUnique({
      where: { id: input.feedId }
    });
    
    if (!feed) {
      throw new TRPCError({ 
        code: 'NOT_FOUND', 
        message: 'フィードが見つかりません' 
      });
    }
    
    // 管理者以外は自分のフィードしか削除できない
    if (feed.userId !== ctx.userId && !ctx.isAdmin) {
      throw new TRPCError({ 
        code: 'FORBIDDEN', 
        message: 'このフィードを削除する権限がありません' 
      });
    }
    
    const result = await rssService.deleteFeed(input.feedId);
    
    if (!result.ok) {
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: result.error.message 
      });
    }
    
    return { success: true };
  });
  
/**
 * ユーザーのフィード一覧を取得
 */
export const getUserFeeds = authenticatedProcedure
  .query(async ({ ctx }) => {
    const result = await rssService.getUserFeeds(ctx.userId);
    
    if (!result.ok) {
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: result.error.message 
      });
    }
    
    return result.value.map(formatFeed);
  });
  
/**
 * 公開フィード一覧を取得
 */
export const getPublicFeeds = publicProcedure
  .query(async () => {
    const result = await rssService.getPublicFeeds();
    
    if (!result.ok) {
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: result.error.message 
      });
    }
    
    return result.value.map(formatFeed);
  });
