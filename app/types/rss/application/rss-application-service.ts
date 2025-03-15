/**
 * RSSリーダー機能のアプリケーションサービス
 */
import { 
  Result, 
  RssFeed, 
  RssArticle, 
  DomainError, 
  createRssUrl, 
  createRssFeed,
  InvalidRssUrlError
} from '../domain';
import { RssFeedRepository, RssArticleRepository } from '../repository';
import { RssFeedService } from '../service';

// アプリケーションサービスのエラー
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationError';
  }
}

// RSSリーダーのアプリケーションサービス
export class RssApplicationService {
  private feedService: RssFeedService;

  constructor(
    private readonly feedRepository: RssFeedRepository,
    private readonly articleRepository: RssArticleRepository
  ) {
    this.feedService = new RssFeedService(feedRepository, articleRepository);
  }

  // 新しいRSSフィードを登録する
  async registerFeed(
    url: string, 
    userId: string | null = null, 
    isPublic: boolean = false
  ): Promise<Result<RssFeed, DomainError | ApplicationError>> {
    // URLのバリデーション
    const urlResult = createRssUrl(url);
    if (!urlResult.ok) {
      return { ok: false, error: urlResult.error };
    }
    const validUrl = urlResult.value;

    // 既存のフィードをチェック
    const existingFeedResult = await this.feedRepository.findByUrl(validUrl);
    if (!existingFeedResult.ok) {
      return { ok: false, error: existingFeedResult.error };
    }

    if (existingFeedResult.value) {
      return { 
        ok: false, 
        error: new ApplicationError('このRSSフィードは既に登録されています') 
      };
    }

    try {
      // RSSフィードを取得して情報を抽出
      const parser = new (await import('rss-parser')).default();
      const parsedFeed = await parser.parseURL(url);

      // フィードを作成
      const feed = createRssFeed(
        '', // IDはリポジトリで生成
        validUrl,
        parsedFeed.title || 'Untitled Feed',
        parsedFeed.description || null,
        isPublic ? 'PUBLIC' : 'PRIVATE',
        userId,
        new Date()
      );

      // フィードを保存
      const savedFeedResult = await this.feedRepository.save(feed);
      if (!savedFeedResult.ok) {
        return { ok: false, error: savedFeedResult.error };
      }
      const savedFeed = savedFeedResult.value;

      // 記事を取得して保存
      const articlesResult = await this.feedService.fetchAndParseFeed(savedFeed);
      if (!articlesResult.ok) {
        // フィードは保存されているが、記事の取得に失敗した場合
        return { ok: true, value: savedFeed };
      }

      if (articlesResult.value.length > 0) {
        await this.articleRepository.saveMany(articlesResult.value);
      }

      return { ok: true, value: savedFeed };
    } catch (error) {
      console.error('フィード登録エラー:', error);
      return { 
        ok: false, 
        error: new ApplicationError(`フィードの登録に失敗しました: ${(error as Error).message}`) 
      };
    }
  }

  // 管理者用: 公開フィードを登録する
  async registerPublicFeed(url: string, adminUserId: string): Promise<Result<RssFeed, DomainError | ApplicationError>> {
    return this.registerFeed(url, adminUserId, true);
  }

  // フィードを削除する
  async deleteFeed(feedId: string, userId: string | null): Promise<Result<boolean, DomainError | ApplicationError>> {
    // フィードの存在確認
    const feedResult = await this.feedRepository.findById(feedId);
    if (!feedResult.ok) {
      return { ok: false, error: feedResult.error };
    }

    const feed = feedResult.value;
    if (!feed) {
      return { 
        ok: false, 
        error: new ApplicationError('指定されたフィードが見つかりません') 
      };
    }

    // 権限チェック
    if (userId && feed.userId !== userId && feed.feedType !== 'PUBLIC') {
      return { 
        ok: false, 
        error: new ApplicationError('このフィードを削除する権限がありません') 
      };
    }

    // フィードを削除
    return this.feedRepository.delete(feedId);
  }

  // フィードを更新する
  async updateFeed(feedId: string): Promise<Result<RssArticle[], DomainError | ApplicationError>> {
    return this.feedService.updateFeed(feedId);
  }

  // すべてのフィードを更新する
  async updateAllFeeds(): Promise<Result<number, DomainError | ApplicationError>> {
    return this.feedService.updateAllFeeds();
  }

  // 公開フィードを取得する
  async getPublicFeeds(): Promise<Result<RssFeed[], DomainError>> {
    return this.feedRepository.findPublicFeeds();
  }

  // ユーザーのフィードを取得する
  async getUserFeeds(userId: string): Promise<Result<RssFeed[], DomainError>> {
    return this.feedRepository.findUserFeeds(userId);
  }

  // 最新の公開記事を取得する
  async getLatestPublicArticles(limit: number = 50): Promise<Result<RssArticle[], DomainError>> {
    return this.articleRepository.findLatestPublicArticles(limit);
  }

  // ユーザーの最新記事を取得する
  async getLatestUserArticles(userId: string, limit: number = 50): Promise<Result<RssArticle[], DomainError>> {
    return this.articleRepository.findLatestUserArticles(userId, limit);
  }

  // フィードの記事を取得する
  async getFeedArticles(feedId: string): Promise<Result<RssArticle[], DomainError>> {
    return this.articleRepository.findByFeedId(feedId);
  }
}
