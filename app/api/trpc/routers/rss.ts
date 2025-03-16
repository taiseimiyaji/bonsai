/**
 * RSSリーダー機能のtRPCルーター
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

import { publicProcedure, router, middleware } from "@/app/api/trpc/init";
import { RssApplicationService } from '@/app/types/rss/application/rss-application-service';
import { PrismaRssFeedRepository, PrismaRssArticleRepository } from '@/app/types/rss/infrastructure/prisma-repository';

// リポジトリの初期化
const feedRepository = new PrismaRssFeedRepository();
const articleRepository = new PrismaRssArticleRepository();

// アプリケーションサービスの初期化
const rssService = new RssApplicationService(feedRepository, articleRepository);

// 認証済みユーザーのみ許可するミドルウェア
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.userId as string,
    },
  });
});

// 管理者のみ許可するミドルウェア
const isAdmin = middleware(async ({ ctx, next }) => {
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

// 認証済みプロシージャ
const authenticatedProcedure = publicProcedure.use(isAuthenticated);

// 管理者用プロシージャ
const adminProcedure = publicProcedure.use(isAdmin);

// 記事データの整形
const formatArticle = (article: any) => {
  return {
    ...article,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : new Date().toISOString(),
    createdAt: article.createdAt ? article.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: article.updatedAt ? article.updatedAt.toISOString() : new Date().toISOString(),
    timeAgo: formatDistanceToNow(new Date(article.publishedAt || new Date()), { 
      addSuffix: true,
      locale: ja
    }),
  };
};

// フィードデータの整形
const formatFeed = (feed: any) => {
  return {
    ...feed,
    lastFetched: feed.lastFetched ? feed.lastFetched.toISOString() : null,
    createdAt: feed.createdAt ? feed.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: feed.updatedAt ? feed.updatedAt.toISOString() : new Date().toISOString(),
  };
};

// RSSルーター
export const rssRouter = router({
  // 公開フィードの記事を取得
  getPublicArticles: publicProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(100).default(50) 
    }))
    .query(async ({ input }) => {
      const result = await rssService.getLatestPublicArticles(input.limit);
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: result.error.message 
        });
      }
      
      // Prismaからフィード情報を取得して記事に追加
      const { prisma } = await import('@/prisma/prisma');
      const articles = result.value;
      const feedIds = [...new Set(articles.map(article => article.feedId))];
      
      const feeds = await prisma.rssFeed.findMany({
        where: { id: { in: feedIds } }
      });
      
      const feedMap = new Map(feeds.map(feed => [feed.id, feed]));
      
      const articlesWithFeed = articles.map(article => {
        const feed = feedMap.get(article.feedId as string);
        return {
          ...formatArticle(article),
          feed: feed ? { title: feed.title, id: feed.id } : undefined
        };
      });
      
      return articlesWithFeed;
    }),

  // ユーザーのフィードと公開フィードの記事を取得
  getUserArticles: authenticatedProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(100).default(50) 
    }))
    .query(async ({ ctx, input }) => {
      const result = await rssService.getLatestUserArticles(ctx.userId, input.limit);
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: result.error.message 
        });
      }
      
      // Prismaからフィード情報を取得して記事に追加
      const { prisma } = await import('@/prisma/prisma');
      const articles = result.value;
      const feedIds = [...new Set(articles.map(article => article.feedId))];
      
      const feeds = await prisma.rssFeed.findMany({
        where: { id: { in: feedIds } }
      });
      
      const feedMap = new Map(feeds.map(feed => [feed.id, feed]));
      
      const articlesWithFeed = articles.map(article => {
        const feed = feedMap.get(article.feedId as string);
        return {
          ...formatArticle(article),
          feed: feed ? { title: feed.title, id: feed.id } : undefined
        };
      });
      
      return articlesWithFeed;
    }),

  // 特定のフィードの記事を取得
  getFeedArticles: publicProcedure
    .input(z.object({ 
      feedId: z.string().min(1) 
    }))
    .query(async ({ input }) => {
      const result = await rssService.getFeedArticles(input.feedId);
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: result.error.message 
        });
      }
      
      // フィード情報を取得
      const { prisma } = await import('@/prisma/prisma');
      const feed = await prisma.rssFeed.findUnique({
        where: { id: input.feedId }
      });
      
      // 記事にフィード情報を追加
      const articles = result.value;
      const articlesWithFeed = articles.map(article => {
        return {
          ...formatArticle(article),
          feed: feed ? { title: feed.title, id: feed.id } : undefined
        };
      });
      
      return articlesWithFeed;
    }),

  // 公開フィードの一覧を取得
  getPublicFeeds: publicProcedure
    .query(async () => {
      const result = await rssService.getPublicFeeds();
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: result.error.message 
        });
      }
      
      return result.value.map(formatFeed);
    }),

  // ユーザーのフィード一覧を取得
  getUserFeeds: authenticatedProcedure
    .query(async ({ ctx }) => {
      const result = await rssService.getUserFeeds(ctx.userId);
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: result.error.message 
        });
      }
      
      return result.value.map(formatFeed);
    }),

  // 新しいフィードを登録（ユーザー）
  addFeed: authenticatedProcedure
    .input(z.object({ 
      url: z.string().url('有効なURLを入力してください') 
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await rssService.registerFeed(input.url, ctx.userId);
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: result.error.message 
        });
      }
      
      return formatFeed(result.value);
    }),

  // 公開フィードを登録（管理者）
  addPublicFeed: adminProcedure
    .input(z.object({ 
      url: z.string().url('有効なURLを入力してください') 
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await rssService.registerPublicFeed(input.url, ctx.userId);
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: result.error.message 
        });
      }
      
      return formatFeed(result.value);
    }),

  // フィードを削除
  deleteFeed: authenticatedProcedure
    .input(z.object({ 
      feedId: z.string().min(1) 
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await rssService.deleteFeed(input.feedId, ctx.userId);
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: result.error.message 
        });
      }
      
      return { success: true };
    }),

  // フィードを更新（手動）
  updateFeed: authenticatedProcedure
    .input(z.object({ 
      feedId: z.string().min(1) 
    }))
    .mutation(async ({ input }) => {
      const result = await rssService.updateFeed(input.feedId);
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: result.error.message 
        });
      }
      
      return { 
        success: true, 
        newArticlesCount: result.value.length 
      };
    }),

  // すべてのフィードを更新（管理者用）
  updateAllFeeds: adminProcedure
    .mutation(async () => {
      const result = await rssService.updateAllFeeds();
      
      if (!result.ok) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: result.error.message 
        });
      }
      
      return { 
        success: true, 
        newArticlesCount: result.value 
      };
    }),
});
