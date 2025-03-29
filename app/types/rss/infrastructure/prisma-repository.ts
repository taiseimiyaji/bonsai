/**
 * RSSリーダー機能のPrismaリポジトリ実装
 */
import { prisma } from '@/prisma/prisma';
import { 
  Result, 
  RssFeed, 
  RssArticle, 
  DomainError, 
  RssUrl, 
  createRssFeed, 
  createRssArticle,
  ok,
  err
} from '../domain';
import { RssFeedRepository, RssArticleRepository } from '../repository';

// Prismaを使用したRssFeedRepositoryの実装
export class PrismaRssFeedRepository implements RssFeedRepository {
  async findById(id: string): Promise<Result<RssFeed | null, DomainError>> {
    try {
      const feed = await prisma.rssFeed.findUnique({
        where: { id }
      });

      if (!feed) {
        return ok(null);
      }

      return ok(
        createRssFeed(
          feed.id,
          feed.url as RssUrl,
          feed.title,
          feed.description,
          feed.feedType,
          feed.userId,
          feed.lastFetched
        )
      );
    } catch (error) {
      console.error('フィード検索エラー:', error);
      return err(new DomainError(`フィードの検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findByUrl(url: RssUrl): Promise<Result<RssFeed | null, DomainError>> {
    try {
      const feed = await prisma.rssFeed.findUnique({
        where: { url: url as string }
      });

      if (!feed) {
        return ok(null);
      }

      return ok(
        createRssFeed(
          feed.id,
          feed.url as RssUrl,
          feed.title,
          feed.description,
          feed.feedType,
          feed.userId,
          feed.lastFetched
        )
      );
    } catch (error) {
      console.error('URL検索エラー:', error);
      return err(new DomainError(`URLによるフィード検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findAll(): Promise<Result<RssFeed[], DomainError>> {
    try {
      const feeds = await prisma.rssFeed.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return ok(
        feeds.map(feed => 
          createRssFeed(
            feed.id,
            feed.url as RssUrl,
            feed.title,
            feed.description,
            feed.feedType,
            feed.userId,
            feed.lastFetched
          )
        )
      );
    } catch (error) {
      console.error('全フィード検索エラー:', error);
      return err(new DomainError(`全フィードの検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findPublicFeeds(): Promise<Result<RssFeed[], DomainError>> {
    try {
      const feeds = await prisma.rssFeed.findMany({
        where: { feedType: 'PUBLIC' },
        orderBy: { createdAt: 'desc' }
      });

      return ok(
        feeds.map(feed => 
          createRssFeed(
            feed.id,
            feed.url as RssUrl,
            feed.title,
            feed.description,
            feed.feedType,
            feed.userId,
            feed.lastFetched
          )
        )
      );
    } catch (error) {
      console.error('公開フィード検索エラー:', error);
      return err(new DomainError(`公開フィードの検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findUserFeeds(userId: string): Promise<Result<RssFeed[], DomainError>> {
    try {
      const feeds = await prisma.rssFeed.findMany({
        where: { 
          OR: [
            { userId },
            { feedType: 'PUBLIC' }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      return ok(
        feeds.map(feed => 
          createRssFeed(
            feed.id,
            feed.url as RssUrl,
            feed.title,
            feed.description,
            feed.feedType,
            feed.userId,
            feed.lastFetched
          )
        )
      );
    } catch (error) {
      console.error('ユーザーフィード検索エラー:', error);
      return err(new DomainError(`ユーザーフィードの検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async save(feed: RssFeed): Promise<Result<RssFeed, DomainError>> {
    try {
      // ユーザーIDがnullの場合は明示的にundefinedを設定して、
      // Prismaがnullではなくundefinedとして扱うようにする
      const savedFeed = await prisma.rssFeed.create({
        data: {
          url: feed.url as string,
          title: feed.title,
          description: feed.description,
          feedType: feed.feedType,
          userId: feed.userId || undefined,
          lastFetched: feed.lastFetched
        }
      });

      return ok(
        createRssFeed(
          savedFeed.id,
          savedFeed.url as RssUrl,
          savedFeed.title,
          savedFeed.description,
          savedFeed.feedType,
          savedFeed.userId,
          savedFeed.lastFetched
        )
      );
    } catch (error) {
      console.error('フィード保存エラー:', error);
      return err(new DomainError(`フィードの保存に失敗しました: ${(error as Error).message}`));
    }
  }

  async update(feed: RssFeed): Promise<Result<RssFeed, DomainError>> {
    try {
      const updatedFeed = await prisma.rssFeed.update({
        where: { id: feed.id as string },
        data: {
          title: feed.title,
          description: feed.description,
          feedType: feed.feedType,
          lastFetched: feed.lastFetched
        }
      });

      return ok(
        createRssFeed(
          updatedFeed.id,
          updatedFeed.url as RssUrl,
          updatedFeed.title,
          updatedFeed.description,
          updatedFeed.feedType,
          updatedFeed.userId,
          updatedFeed.lastFetched
        )
      );
    } catch (error) {
      console.error('フィード更新エラー:', error);
      return err(new DomainError(`フィードの更新に失敗しました: ${(error as Error).message}`));
    }
  }

  async delete(id: string): Promise<Result<boolean, DomainError>> {
    try {
      await prisma.rssFeed.delete({
        where: { id }
      });

      return ok(true);
    } catch (error) {
      console.error('フィード削除エラー:', error);
      return err(new DomainError(`フィードの削除に失敗しました: ${(error as Error).message}`));
    }
  }

  async updateLastFetched(id: string, lastFetched: Date): Promise<Result<RssFeed, DomainError>> {
    try {
      const updatedFeed = await prisma.rssFeed.update({
        where: { id },
        data: { lastFetched }
      });

      return ok(
        createRssFeed(
          updatedFeed.id,
          updatedFeed.url as RssUrl,
          updatedFeed.title,
          updatedFeed.description,
          updatedFeed.feedType,
          updatedFeed.userId,
          updatedFeed.lastFetched
        )
      );
    } catch (error) {
      console.error('最終取得日時更新エラー:', error);
      return err(new DomainError(`最終取得日時の更新に失敗しました: ${(error as Error).message}`));
    }
  }
}

// Prismaを使用したRssArticleRepositoryの実装
export class PrismaRssArticleRepository implements RssArticleRepository {
  async findById(id: string): Promise<Result<RssArticle | null, DomainError>> {
    try {
      const article = await prisma.rssArticle.findUnique({
        where: { id }
      });

      if (!article) {
        return ok(null);
      }

      return ok(
        createRssArticle(
          article.id,
          article.feedId as any,
          article.title,
          article.link,
          article.publishedAt,
          article.description,
          article.content,
          article.author,
          article.imageUrl
        )
      );
    } catch (error) {
      console.error('記事検索エラー:', error);
      return err(new DomainError(`記事の検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findByLink(link: string): Promise<Result<RssArticle | null, DomainError>> {
    try {
      console.log(`[DEBUG] リンクで記事検索: link=${link}`);
      const article = await prisma.rssArticle.findUnique({
        where: { link }
      });

      if (!article) {
        console.log(`[DEBUG] 記事が見つかりません: link=${link}`);
        return ok(null);
      }

      console.log(`[DEBUG] 記事が見つかりました: id=${article.id}, title=${article.title}`);
      return ok(
        createRssArticle(
          article.id,
          article.feedId as any,
          article.title,
          article.link,
          article.publishedAt,
          article.description,
          article.content,
          article.author,
          article.imageUrl
        )
      );
    } catch (error) {
      console.error(`[DEBUG] リンク検索エラー: ${(error as Error).message}`, error);
      return err(new DomainError(`リンクによる記事検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findByFeedId(feedId: string): Promise<Result<RssArticle[], DomainError>> {
    try {
      const articles = await prisma.rssArticle.findMany({
        where: { feedId },
        orderBy: { publishedAt: 'desc' }
      });

      return ok(
        articles.map(article => 
          createRssArticle(
            article.id,
            article.feedId as any,
            article.title,
            article.link,
            article.publishedAt,
            article.description,
            article.content,
            article.author,
            article.imageUrl
          )
        )
      );
    } catch (error) {
      console.error('フィードID検索エラー:', error);
      return err(new DomainError(`フィードIDによる記事検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findLatestArticles(limit: number): Promise<Result<RssArticle[], DomainError>> {
    try {
      const articles = await prisma.rssArticle.findMany({
        orderBy: { publishedAt: 'desc' },
        take: limit
      });

      return ok(
        articles.map(article => 
          createRssArticle(
            article.id,
            article.feedId as any,
            article.title,
            article.link,
            article.publishedAt,
            article.description,
            article.content,
            article.author,
            article.imageUrl
          )
        )
      );
    } catch (error) {
      console.error('最新記事検索エラー:', error);
      return err(new DomainError(`最新記事の検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findLatestPublicArticles(limit: number): Promise<Result<RssArticle[], DomainError>> {
    try {
      const articles = await prisma.rssArticle.findMany({
        where: {
          feed: {
            feedType: 'PUBLIC'
          }
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        include: {
          feed: true
        }
      });

      return ok(
        articles.map(article => 
          createRssArticle(
            article.id,
            article.feedId as any,
            article.title,
            article.link,
            article.publishedAt,
            article.description,
            article.content,
            article.author,
            article.imageUrl
          )
        )
      );
    } catch (error) {
      console.error('公開記事検索エラー:', error);
      return err(new DomainError(`公開記事の検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async findLatestUserArticles(userId: string, limit: number): Promise<Result<RssArticle[], DomainError>> {
    try {
      const articles = await prisma.rssArticle.findMany({
        where: {
          feed: {
            OR: [
              { userId },
              { feedType: 'PUBLIC' }
            ]
          }
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        include: {
          feed: true
        }
      });

      return ok(
        articles.map(article => 
          createRssArticle(
            article.id,
            article.feedId as any,
            article.title,
            article.link,
            article.publishedAt,
            article.description,
            article.content,
            article.author,
            article.imageUrl
          )
        )
      );
    } catch (error) {
      console.error('ユーザー記事検索エラー:', error);
      return err(new DomainError(`ユーザー記事の検索に失敗しました: ${(error as Error).message}`));
    }
  }

  async save(article: RssArticle): Promise<Result<RssArticle, DomainError>> {
    try {
      const savedArticle = await prisma.rssArticle.create({
        data: {
          feedId: article.feedId as string,
          title: article.title,
          link: article.link,
          description: article.description,
          content: article.content,
          author: article.author,
          publishedAt: article.publishedAt,
          imageUrl: article.imageUrl
        }
      });

      return ok(
        createRssArticle(
          savedArticle.id,
          savedArticle.feedId as any,
          savedArticle.title,
          savedArticle.link,
          savedArticle.publishedAt,
          savedArticle.description,
          savedArticle.content,
          savedArticle.author,
          savedArticle.imageUrl
        )
      );
    } catch (error) {
      console.error('記事保存エラー:', error);
      return err(new DomainError(`記事の保存に失敗しました: ${(error as Error).message}`));
    }
  }

  async saveMany(articles: RssArticle[]): Promise<Result<RssArticle[], DomainError>> {
    try {
      console.log(`[DEBUG] 複数記事保存開始: ${articles.length}件`);
      const data = articles.map(article => ({
        feedId: article.feedId as string,
        title: article.title,
        link: article.link,
        description: article.description,
        content: article.content,
        author: article.author,
        publishedAt: article.publishedAt,
        imageUrl: article.imageUrl
      }));

      console.log(`[DEBUG] トランザクション開始`);
      const savedArticles = await prisma.$transaction(
        data.map(item => 
          prisma.rssArticle.create({ data: item })
        )
      );
      console.log(`[DEBUG] トランザクション完了: ${savedArticles.length}件保存`);

      return ok(
        savedArticles.map(article => 
          createRssArticle(
            article.id,
            article.feedId as any,
            article.title,
            article.link,
            article.publishedAt,
            article.description,
            article.content,
            article.author,
            article.imageUrl
          )
        )
      );
    } catch (error) {
      console.error(`[DEBUG] 複数記事保存エラー: ${(error as Error).message}`, error);
      return err(new DomainError(`複数記事の保存に失敗しました: ${(error as Error).message}`));
    }
  }
}
