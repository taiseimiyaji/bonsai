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
  async addFeed(
    url: string, 
    userId: string | null = null
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
      
      // URLが有効かどうか再確認
      if (!url || typeof url !== 'string') {
        return { 
          ok: false, 
          error: new ApplicationError('無効なURL形式です') 
        };
      }
      
      // URLをトリムして余分な空白を削除
      const trimmedUrl = url.trim();
      
      try {
        const parsedFeed = await parser.parseURL(trimmedUrl);
        
        // フィードを作成
        const feed = createRssFeed(
          '', // IDはリポジトリで生成
          validUrl,
          parsedFeed.title || 'Untitled Feed',
          parsedFeed.description || null,
          'PRIVATE', // ユーザーが追加する場合はPRIVATE
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
      } catch (parseError) {
        console.error('RSSフィードの解析エラー:', parseError);
        return { 
          ok: false, 
          error: new ApplicationError(`RSSフィードの取得・解析に失敗しました: ${(parseError as Error).message}`) 
        };
      }
    } catch (error) {
      console.error('フィード登録エラー:', error);
      return { 
        ok: false, 
        error: new ApplicationError(`フィードの登録に失敗しました: ${(error as Error).message}`) 
      };
    }
  }

  // 管理者用: 公開フィードを登録する
  async addPublicFeed(url: string): Promise<Result<RssFeed, DomainError | ApplicationError>> {
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
      
      // URLが有効かどうか再確認
      if (!url || typeof url !== 'string') {
        return { 
          ok: false, 
          error: new ApplicationError('無効なURL形式です') 
        };
      }
      
      // URLをトリムして余分な空白を削除
      const trimmedUrl = url.trim();
      
      try {
        const parsedFeed = await parser.parseURL(trimmedUrl);
        
        // フィードを作成
        const feed = createRssFeed(
          '', // IDはリポジトリで生成
          validUrl,
          parsedFeed.title || 'Untitled Feed',
          parsedFeed.description || null,
          'PUBLIC', // 管理者が追加する場合はPUBLIC
          null, // 公開フィードはユーザーIDなし
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
      } catch (parseError) {
        console.error('RSSフィードの解析エラー:', parseError);
        return { 
          ok: false, 
          error: new ApplicationError(`RSSフィードの取得・解析に失敗しました: ${(parseError as Error).message}`) 
        };
      }
    } catch (error) {
      console.error('フィード登録エラー:', error);
      return { 
        ok: false, 
        error: new ApplicationError(`フィードの登録に失敗しました: ${(error as Error).message}`) 
      };
    }
  }

  // フィードを削除する
  async deleteFeed(feedId: string): Promise<Result<boolean, DomainError | ApplicationError>> {
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

    // フィードを削除
    return this.feedRepository.delete(feedId);
  }

  // フィードを更新する
  async updateFeed(feedId: string): Promise<Result<RssArticle[], DomainError | ApplicationError>> {
    return this.feedService.updateFeed(feedId);
  }

  // すべてのフィードを更新する
  async updateAllFeeds(): Promise<Result<number, DomainError | ApplicationError>> {
    try {
      // すべてのフィードを取得
      const feedsResult = await this.feedRepository.findAll();
      if (!feedsResult.ok) {
        return { ok: false, error: feedsResult.error };
      }
      
      const feeds = feedsResult.value;
      console.log(`全${feeds.length}件のフィードを更新します`);
      
      let updatedCount = 0;
      const errors: { feedId: string; error: string }[] = [];
      
      // 各フィードを順番に更新
      for (const feed of feeds) {
        try {
          console.log(`フィード更新中: ${feed.title} (${feed.id})`);
          const updateResult = await this.feedService.fetchAndSaveArticles(feed);
          
          if (updateResult.ok) {
            updatedCount++;
            console.log(`フィード更新成功: ${feed.title} - 記事数: ${updateResult.value.length}`);
          } else {
            console.error(`フィード更新エラー: ${feed.title} - ${updateResult.error.message}`);
            errors.push({ feedId: feed.id, error: updateResult.error.message });
          }
        } catch (error) {
          console.error(`予期しないエラー: ${feed.title} - ${(error as Error).message}`);
          errors.push({ feedId: feed.id, error: (error as Error).message });
        }
        
        // レート制限を避けるための短い待機
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // エラーがあった場合はログに記録
      if (errors.length > 0) {
        console.warn(`${errors.length}件のフィードで更新エラーが発生しました`);
        console.warn(JSON.stringify(errors, null, 2));
      }
      
      return { ok: true, value: updatedCount };
    } catch (error) {
      return { 
        ok: false, 
        error: new ApplicationError(`すべてのフィード更新中にエラーが発生しました: ${(error as Error).message}`) 
      };
    }
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

  // 特定のフィードの記事を取得する
  async getFeedArticles(feedId: string): Promise<Result<RssArticle[], DomainError>> {
    return this.articleRepository.findByFeedId(feedId);
  }
}
