/**
 * 後で読む機能のプロシージャ
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { authenticatedProcedure } from './middleware';
import { formatArticle } from './utils';
import type { ReadLater, RssArticle, RssFeed, RssReadStatus } from '@prisma/client';

/**
 * 後で読むリストに記事を追加
 */
export const addToReadLater = authenticatedProcedure
  .input(z.object({ 
    articleId: z.string() 
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      const { prisma } = await import('@/prisma/prisma');
      const userId = ctx.userId;
      
      // 既に追加済みかチェック
      const existing = await prisma.readLater.findUnique({
        where: {
          userId_articleId: {
            userId,
            articleId: input.articleId
          }
        }
      });
      
      if (existing) {
        return { success: true, message: '既に後で読むリストに追加されています' };
      }
      
      // 記事が存在するかチェック
      const article = await prisma.rssArticle.findUnique({
        where: { id: input.articleId }
      });
      
      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '記事が見つかりません'
        });
      }
      
      // 後で読むリストに追加
      await prisma.readLater.create({
        data: {
          userId,
          articleId: input.articleId
        }
      });
      
      return { success: true, message: '後で読むリストに追加しました' };
    } catch (error) {
      console.error('後で読むリストへの追加エラー:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `後で読むリストへの追加に失敗しました: ${(error as Error).message}`
      });
    }
  });

/**
 * 後で読むリストから記事を削除
 */
export const removeFromReadLater = authenticatedProcedure
  .input(z.object({ 
    articleId: z.string() 
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      const { prisma } = await import('@/prisma/prisma');
      const userId = ctx.userId;
      
      // 削除
      await prisma.readLater.deleteMany({
        where: {
          userId,
          articleId: input.articleId
        }
      });
      
      return { success: true, message: '後で読むリストから削除しました' };
    } catch (error) {
      console.error('後で読むリストからの削除エラー:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `後で読むリストからの削除に失敗しました: ${(error as Error).message}`
      });
    }
  });

/**
 * 後で読むリストの記事を取得
 */
export const getReadLaterArticles = authenticatedProcedure
  .input(z.object({ 
    limit: z.number().min(1).max(100).default(50) 
  }))
  .query(async ({ ctx, input }) => {
    try {
      const { prisma } = await import('@/prisma/prisma');
      const userId = ctx.userId;
      
      // 後で読むリストを取得
      const readLaterItems = await prisma.readLater.findMany({
        where: { userId },
        orderBy: { addedAt: 'desc' },
        take: input.limit,
        include: {
          article: {
            include: {
              feed: true
            }
          }
        }
      });
      
      // 既読状態を取得
      const articleIds = readLaterItems.map(item => item.articleId);
      const readStatuses = await prisma.rssReadStatus.findMany({
        where: {
          userId,
          articleId: { in: articleIds }
        }
      });
      
      const readStatusMap = new Map(readStatuses.map(status => [status.articleId, status]));
      
      // 記事情報をフォーマット
      const articles = readLaterItems.map(item => {
        const article = item.article;
        const isRead = !!readStatusMap.get(article.id);
        
        return {
          ...formatArticle(article),
          feed: {
            title: article.feed.title,
            id: article.feed.id
          },
          isRead
        };
      });
      
      return articles;
    } catch (error) {
      console.error('後で読むリスト取得エラー:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `後で読むリストの取得に失敗しました: ${(error as Error).message}`
      });
    }
  });

/**
 * 記事が後で読むリストに追加されているかチェック
 */
export const isInReadLater = authenticatedProcedure
  .input(z.object({ 
    articleIds: z.array(z.string())
  }))
  .query(async ({ ctx, input }) => {
    try {
      const { prisma } = await import('@/prisma/prisma');
      const userId = ctx.userId;
      
      // 後で読むリストに含まれている記事を取得
      const readLaterItems = await prisma.readLater.findMany({
        where: {
          userId,
          articleId: { in: input.articleIds }
        },
        select: {
          articleId: true
        }
      });
      
      // 記事IDごとの結果をマップ
      const result = Object.fromEntries(
        input.articleIds.map(id => [id, readLaterItems.some(item => item.articleId === id)])
      );
      
      return result;
    } catch (error) {
      console.error('後で読むリストチェックエラー:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `後で読むリストのチェックに失敗しました: ${(error as Error).message}`
      });
    }
  });

/**
 * 既読になった記事を後で読むリストから自動的に削除
 */
export const cleanupReadLater = authenticatedProcedure
  .mutation(async ({ ctx }) => {
    try {
      const { prisma } = await import('@/prisma/prisma');
      const userId = ctx.userId;
      
      // 後で読むリストの記事IDを取得
      const readLaterItems = await prisma.readLater.findMany({
        where: { userId },
        select: { articleId: true }
      });
      
      const articleIds = readLaterItems.map(item => item.articleId);
      
      if (articleIds.length === 0) {
        return { success: true, count: 0 };
      }
      
      // 既読状態の記事を取得
      const readStatuses = await prisma.rssReadStatus.findMany({
        where: {
          userId,
          articleId: { in: articleIds },
          isRead: true
        },
        select: { articleId: true }
      });
      
      const readArticleIds = readStatuses.map(status => status.articleId);
      
      if (readArticleIds.length === 0) {
        return { success: true, count: 0 };
      }
      
      // 既読になった記事を後で読むリストから削除
      const { count } = await prisma.readLater.deleteMany({
        where: {
          userId,
          articleId: { in: readArticleIds }
        }
      });
      
      return { success: true, count };
    } catch (error) {
      console.error('後で読むリストのクリーンアップエラー:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `後で読むリストのクリーンアップに失敗しました: ${(error as Error).message}`
      });
    }
  });
