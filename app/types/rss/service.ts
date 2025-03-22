/**
 * RSSリーダー機能のドメインサービス
 */
import { Result, RssFeed, RssArticle, RssFetchError, DomainError, RssUrl, createRssArticle } from './domain';
import { RssFeedRepository, RssArticleRepository } from './repository';
import Parser from 'rss-parser';

// RSSフィードを取得・解析するサービス
export class RssFeedService {
  private parser: Parser;

  constructor(
    private readonly feedRepository: RssFeedRepository,
    private readonly articleRepository: RssArticleRepository
  ) {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media'],
          ['content:encoded', 'contentEncoded'],
        ],
      },
    });
  }

  // RSSフィードを取得して解析する
  async fetchAndParseFeed(feed: RssFeed): Promise<Result<RssArticle[], RssFetchError>> {
    try {
      // URLの検証
      if (!feed.url) {
        return { 
          ok: false, 
          error: new RssFetchError('フィードURLが指定されていません') 
        };
      }
      
      // URLをトリムして余分な空白を削除
      const url = (feed.url as string).trim();
      
      try {
        // フィードを取得
        const parsedFeed = await this.parser.parseURL(url);
        
        if (!parsedFeed.items || parsedFeed.items.length === 0) {
          return { ok: true, value: [] };
        }

        // 記事を作成
        const articles: RssArticle[] = parsedFeed.items.map(item => {
          // 日付の処理
          const publishedDate = item.pubDate || item.isoDate 
            ? new Date(item.pubDate || item.isoDate || '') 
            : new Date();

          // メディア画像の取得
          let imageUrl = null;
          if (item.media && item.media.$ && item.media.$.url) {
            imageUrl = item.media.$.url;
          } else if (item.enclosure && item.enclosure.url) {
            imageUrl = item.enclosure.url;
          }

          // コンテンツの取得
          const content = item.contentEncoded || item.content || item['content:encoded'] || null;

          return createRssArticle(
            '', // IDはリポジトリで生成
            feed.id,
            item.title || '無題',
            item.link || '',
            publishedDate,
            item.description || null,
            content,
            item.creator || item.author || null,
            imageUrl
          );
        });

        return { ok: true, value: articles };
      } catch (parseError) {
        console.error(`フィード「${feed.title}」の解析エラー:`, parseError);
        return { 
          ok: false, 
          error: new RssFetchError(`RSSフィードの解析に失敗しました: ${(parseError as Error).message}`) 
        };
      }
    } catch (error) {
      console.error('RSSフィードの取得・解析に失敗しました:', error);
      return { 
        ok: false, 
        error: new RssFetchError(`RSSフィードの取得に失敗しました: ${(error as Error).message}`) 
      };
    }
  }

  // フィードを更新し、新しい記事を保存する
  async updateFeed(feedId: string): Promise<Result<RssArticle[], DomainError>> {
    // フィードを取得
    const feedResult = await this.feedRepository.findById(feedId);
    if (!feedResult.ok) {
      return { ok: false, error: feedResult.error };
    }
    
    const feed = feedResult.value;
    if (!feed) {
      return { ok: false, error: new DomainError('フィードが見つかりません') };
    }

    // フィードから記事を取得
    const articlesResult = await this.fetchAndParseFeed(feed);
    if (!articlesResult.ok) {
      return { ok: false, error: articlesResult.error };
    }

    const articles = articlesResult.value;
    if (articles.length === 0) {
      // 最終更新日時を更新
      await this.feedRepository.updateLastFetched(feedId, new Date());
      return { ok: true, value: [] };
    }

    // 新しい記事のみをフィルタリング
    const newArticles: RssArticle[] = [];
    for (const article of articles) {
      const existingArticle = await this.articleRepository.findByLink(article.link);
      if (!existingArticle.ok) {
        return { ok: false, error: existingArticle.error };
      }
      
      if (!existingArticle.value) {
        newArticles.push(article);
      }
    }

    // 新しい記事を保存
    if (newArticles.length > 0) {
      const savedResult = await this.articleRepository.saveMany(newArticles);
      if (!savedResult.ok) {
        return { ok: false, error: savedResult.error };
      }
    }

    // 最終更新日時を更新
    await this.feedRepository.updateLastFetched(feedId, new Date());

    return { ok: true, value: newArticles };
  }

  // すべてのフィードを更新する（バッチ処理用）
  async updateAllFeeds(): Promise<Result<number, DomainError>> {
    const feedsResult = await this.feedRepository.findAll();
    if (!feedsResult.ok) {
      return { ok: false, error: feedsResult.error };
    }

    const feeds = feedsResult.value;
    let updatedCount = 0;

    for (const feed of feeds) {
      const result = await this.updateFeed(feed.id as string);
      if (result.ok && result.value.length > 0) {
        updatedCount += result.value.length;
      }
    }

    return { ok: true, value: updatedCount };
  }

  /**
   * フィードから記事を取得して保存する
   * @param feed 対象のRSSフィード
   * @returns 保存された記事の配列
   */
  async fetchAndSaveArticles(feed: RssFeed): Promise<Result<RssArticle[], DomainError>> {
    try {
      // フィードから記事を取得
      const articlesResult = await this.fetchAndParseFeed(feed);
      if (!articlesResult.ok) {
        return { ok: false, error: articlesResult.error };
      }

      const articles = articlesResult.value;
      if (articles.length === 0) {
        // 記事がない場合は最終更新日時だけ更新
        await this.feedRepository.updateLastFetched(feed.id, new Date());
        return { ok: true, value: [] };
      }

      // 新しい記事のみをフィルタリング
      const newArticles: RssArticle[] = [];
      for (const article of articles) {
        const existingArticle = await this.articleRepository.findByLink(article.link);
        if (!existingArticle.ok) {
          return { ok: false, error: existingArticle.error };
        }
        
        if (!existingArticle.value) {
          newArticles.push(article);
        }
      }

      // 新しい記事を保存
      let savedArticles: RssArticle[] = [];
      if (newArticles.length > 0) {
        const savedResult = await this.articleRepository.saveMany(newArticles);
        if (!savedResult.ok) {
          return { ok: false, error: savedResult.error };
        }
        savedArticles = savedResult.value;
      }

      // 最終更新日時を更新
      await this.feedRepository.updateLastFetched(feed.id, new Date());

      return { ok: true, value: savedArticles };
    } catch (error) {
      console.error(`フィード「${feed.title}」の更新中にエラーが発生しました:`, error);
      return { 
        ok: false, 
        error: new DomainError(`フィードの更新に失敗しました: ${(error as Error).message}`) 
      };
    }
  }
}
