/**
 * RSS記事関連のプロシージャ
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure } from "@/app/api/trpc/init";
import { authenticatedProcedure } from './middleware';
import { formatArticle, formatFeed } from './utils';
import { RssApplicationService } from '@/app/types/rss/application/rss-application-service';
import { PrismaRssFeedRepository, PrismaRssArticleRepository } from '@/app/types/rss/infrastructure/prisma-repository';
import './types'; // 型定義をインポート

// リポジトリの初期化
const feedRepository = new PrismaRssFeedRepository();
const articleRepository = new PrismaRssArticleRepository();

// アプリケーションサービスの初期化
const rssService = new RssApplicationService(feedRepository, articleRepository);

/**
 * 公開フィードの記事を取得
 */
export const getPublicArticles = publicProcedure
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
  });

/**
 * ユーザーのフィードと公開フィードの記事を取得
 */
export const getUserArticles = authenticatedProcedure
  .input(z.object({ 
    limit: z.number().min(1).max(100).default(50),
    readFilter: z.enum(['all', 'read', 'unread']).optional().default('all')
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
    
    // 既読状態を取得
    const readStatuses = await prisma.rssReadStatus.findMany({
      where: {
        userId: ctx.userId,
        articleId: { in: articles.map(article => article.id) }
      }
    });
    
    const readStatusMap = new Map(readStatuses.map(status => [status.articleId, status]));
    
    // 記事に既読状態を追加し、フィルタリング
    let articlesWithFeed = articles.map(article => {
      const feed = feedMap.get(article.feedId as string);
      const readStatus = readStatusMap.get(article.id);
      
      return {
        ...formatArticle(article),
        feed: feed ? { title: feed.title, id: feed.id } : undefined,
        isRead: !!readStatus // 既読状態を追加
      };
    });
    
    // 既読/未読フィルタリング
    if (input.readFilter === 'read') {
      articlesWithFeed = articlesWithFeed.filter(article => article.isRead);
    } else if (input.readFilter === 'unread') {
      articlesWithFeed = articlesWithFeed.filter(article => !article.isRead);
    }
    
    return articlesWithFeed;
  });

/**
 * 特定のフィードの記事を取得
 */
export const getFeedArticles = publicProcedure
  .input(z.object({ 
    feedId: z.string().min(1),
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10)
  }))
  .query(async ({ input, ctx }) => {
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
    
    // ページネーション処理
    const startIndex = (input.page - 1) * input.pageSize;
    const endIndex = startIndex + input.pageSize;
    const paginatedArticles = articles.slice(startIndex, endIndex);
    
    // ログインユーザーの場合は既読状態を取得
    let readStatusMap = new Map();
    if (ctx.session?.userId) {
      const readStatuses = await prisma.rssReadStatus.findMany({
        where: {
          userId: ctx.session.userId as string,
          articleId: { in: paginatedArticles.map(article => article.id) }
        }
      });
      readStatusMap = new Map(readStatuses.map(status => [status.articleId, status]));
    }
    
    const articlesWithFeed = paginatedArticles.map(article => {
      const readStatus = ctx.session?.userId ? readStatusMap.get(article.id) : null;
      
      return {
        ...formatArticle(article),
        feed: feed ? { title: feed.title, id: feed.id } : undefined,
        isRead: !!readStatus // ログインユーザーの場合のみ既読状態を追加
      };
    });
    
    return {
      articles: articlesWithFeed,
      feed: feed ? formatFeed(feed) : null,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems: articles.length,
        totalPages: Math.ceil(articles.length / input.pageSize)
      }
    };
  });

/**
 * 記事を既読にする
 */
export const markAsRead = authenticatedProcedure
  .input(z.object({
    articleId: z.string().min(1)
  }))
  .mutation(async ({ ctx, input }) => {
    const { prisma } = await import('@/prisma/prisma');
    
    // 記事が存在するか確認
    const article = await prisma.rssArticle.findUnique({
      where: { id: input.articleId }
    });
    
    if (!article) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '指定された記事が見つかりません'
      });
    }
    
    // 既読状態を作成または更新
    const readStatus = await prisma.rssReadStatus.upsert({
      where: {
        userId_articleId: {
          userId: ctx.userId,
          articleId: input.articleId
        }
      },
      update: {
        isRead: true,
        readAt: new Date()
      },
      create: {
        userId: ctx.userId,
        articleId: input.articleId,
        isRead: true,
        readAt: new Date()
      }
    });
    
    return { success: true, readStatus };
  });
  
/**
 * 複数記事の既読状態を一括取得
 */
export const getReadStatuses = authenticatedProcedure
  .input(z.object({
    articleIds: z.array(z.string().min(1))
  }))
  .query(async ({ ctx, input }) => {
    const { prisma } = await import('@/prisma/prisma');
    
    const readStatuses = await prisma.rssReadStatus.findMany({
      where: {
        userId: ctx.userId,
        articleId: { in: input.articleIds }
      }
    });
    
    // 記事IDをキーとした既読状態のマップを作成
    const readStatusMap = readStatuses.reduce((map, status) => {
      map[status.articleId] = status.isRead;
      return map;
    }, {} as Record<string, boolean>);
    
    return readStatusMap;
  });

/**
 * Zennのトレンド記事を取得
 */
export const getZennTrendArticles = publicProcedure
  .input(z.object({ 
    limit: z.number().min(1).max(100).default(50),
    readFilter: z.enum(['all', 'read', 'unread']).optional().default('all')
  }))
  .query(async ({ ctx, input }) => {
    try {
      // Zennのフィードを検索
      const { prisma } = await import('@/prisma/prisma');
      let zennFeed = await prisma.rssFeed.findFirst({
        where: { url: 'https://zenn.dev/feed' }
      });
      
      // Zennのフィードが存在しない場合は作成
      if (!zennFeed) {
        const result = await rssService.addPublicFeed('https://zenn.dev/feed');
        if (!result.ok) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Zennフィードの追加に失敗しました: ${result.error.message}` 
          });
        }
        // 型の不一致を解消するため、Prismaから再取得
        const newFeed = await prisma.rssFeed.findFirst({
          where: { url: 'https://zenn.dev/feed' }
        });
        
        if (!newFeed) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Zennフィードの取得に失敗しました' 
          });
        }
        
        zennFeed = newFeed;
      } else {
        // フィードが存在する場合は更新（最新の記事を取得）
        await rssService.updateFeed(zennFeed.id);
      }
      
      // Zennの記事を取得
      const articles = await prisma.rssArticle.findMany({
        where: { feedId: zennFeed.id },
        orderBy: { publishedAt: 'desc' },
        take: input.limit
      });
      
      // ログインユーザーの場合は既読状態を取得
      let readStatusMap = new Map();
      if (ctx.session?.userId) {
        const readStatuses = await prisma.rssReadStatus.findMany({
          where: {
            userId: ctx.session.userId as string,
            articleId: { in: articles.map(article => article.id) }
          }
        });
        readStatusMap = new Map(readStatuses.map(status => [status.articleId, status]));
      }
      
      // 記事にフィード情報と既読状態を追加
      let articlesWithFeed = articles.map(article => {
        const readStatus = ctx.session?.userId ? readStatusMap.get(article.id) : null;
        
        return {
          ...formatArticle(article),
          feed: { title: zennFeed.title, id: zennFeed.id },
          isRead: !!readStatus
        };
      });
      
      // 既読/未読フィルタリング
      if (ctx.session?.userId && input.readFilter !== 'all') {
        articlesWithFeed = articlesWithFeed.filter(article => 
          input.readFilter === 'read' ? article.isRead : !article.isRead
        );
      }
      
      return articlesWithFeed;
    } catch (error) {
      console.error('Zennトレンド記事取得エラー:', error);
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: `Zennトレンド記事の取得に失敗しました: ${(error as Error).message}` 
      });
    }
  });

/**
 * Qiitaのトレンド記事を取得
 */
export const getQiitaTrendArticles = publicProcedure
  .input(z.object({ 
    limit: z.number().min(1).max(100).default(50),
    readFilter: z.enum(['all', 'read', 'unread']).optional().default('all')
  }))
  .query(async ({ ctx, input }) => {
    try {
      // Qiitaのフィードを検索
      const { prisma } = await import('@/prisma/prisma');
      let qiitaFeed = await prisma.rssFeed.findFirst({
        where: { url: 'https://qiita.com/popular-items/feed' }
      });
      
      // Qiitaのフィードが存在しない場合は作成
      if (!qiitaFeed) {
        const result = await rssService.addPublicFeed('https://qiita.com/popular-items/feed');
        if (!result.ok) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Qiitaフィードの追加に失敗しました: ${result.error.message}` 
          });
        }
        // 型の不一致を解消するため、Prismaから再取得
        const newFeed = await prisma.rssFeed.findFirst({
          where: { url: 'https://qiita.com/popular-items/feed' }
        });
        
        if (!newFeed) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Qiitaフィードの取得に失敗しました' 
          });
        }
        
        qiitaFeed = newFeed;
      } else {
        // フィードが存在する場合は更新（最新の記事を取得）
        await rssService.updateFeed(qiitaFeed.id);
      }
      
      // Qiitaの記事を取得
      const articles = await prisma.rssArticle.findMany({
        where: { feedId: qiitaFeed.id },
        orderBy: { publishedAt: 'desc' },
        take: input.limit
      });
      
      // ログインユーザーの場合は既読状態を取得
      let readStatusMap = new Map();
      if (ctx.session?.userId) {
        const readStatuses = await prisma.rssReadStatus.findMany({
          where: {
            userId: ctx.session.userId as string,
            articleId: { in: articles.map(article => article.id) }
          }
        });
        readStatusMap = new Map(readStatuses.map(status => [status.articleId, status]));
      }
      
      // 記事にフィード情報と既読状態を追加
      let articlesWithFeed = articles.map(article => {
        const readStatus = ctx.session?.userId ? readStatusMap.get(article.id) : null;
        
        return {
          ...formatArticle(article),
          feed: { title: qiitaFeed.title, id: qiitaFeed.id },
          isRead: !!readStatus
        };
      });
      
      // 既読/未読フィルタリング
      if (ctx.session?.userId && input.readFilter !== 'all') {
        articlesWithFeed = articlesWithFeed.filter(article => 
          input.readFilter === 'read' ? article.isRead : !article.isRead
        );
      }
      
      return articlesWithFeed;
    } catch (error) {
      console.error('Qiitaトレンド記事取得エラー:', error);
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: `Qiitaトレンド記事の取得に失敗しました: ${(error as Error).message}` 
      });
    }
  });
