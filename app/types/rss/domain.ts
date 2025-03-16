/**
 * RSSリーダー機能のドメインモデル
 */

// ブランデッド型の定義
type Branded<T, B> = T & { _brand: B };

// 値オブジェクト用の型
export type RssFeedId = Branded<string, 'RssFeedId'>;
export type RssArticleId = Branded<string, 'RssArticleId'>;
export type RssUrl = Branded<string, 'RssUrl'>;

// 結果型
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// エラー型
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InvalidRssUrlError extends DomainError {
  constructor(message: string = 'RSSのURLが無効です') {
    super(message);
    this.name = 'InvalidRssUrlError';
  }
}

export class RssFetchError extends DomainError {
  constructor(message: string = 'RSSの取得に失敗しました') {
    super(message);
    this.name = 'RssFetchError';
  }
}

// ヘルパー関数
export function ok<T, E>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function err<T, E>(error: E): Result<T, E> {
  return { ok: false, error };
}

// 値オブジェクト: RssUrl
export function createRssUrl(url: string): Result<RssUrl, InvalidRssUrlError> {
  try {
    // URLの形式チェック
    new URL(url);
    
    // 簡易的なRSS URLチェック（より厳密にはfetchして確認が必要）
    if (!url.includes('rss') && !url.includes('feed') && !url.includes('atom') && !url.endsWith('xml')) {
      return err(new InvalidRssUrlError('URLがRSSフィードの形式ではありません'));
    }
    
    return ok(url as RssUrl);
  } catch (error) {
    return err(new InvalidRssUrlError('URLの形式が正しくありません'));
  }
}

// エンティティ: RssFeed
export interface RssFeed {
  id: RssFeedId;
  url: RssUrl;
  title: string;
  description: string | null;
  feedType: 'PUBLIC' | 'PRIVATE';
  userId: string | null;
  lastFetched: Date | null;
}

// エンティティ: RssArticle
export interface RssArticle {
  id: RssArticleId;
  feedId: RssFeedId;
  title: string;
  link: string;
  description: string | null;
  content: string | null;
  author: string | null;
  publishedAt: Date;
  imageUrl: string | null;
}

// ファクトリ関数: RssFeed
export function createRssFeed(
  id: string,
  url: RssUrl,
  title: string,
  description: string | null,
  feedType: 'PUBLIC' | 'PRIVATE',
  userId: string | null,
  lastFetched: Date | null = null
): RssFeed {
  return {
    id: id as RssFeedId,
    url,
    title,
    description,
    feedType,
    userId,
    lastFetched
  };
}

// ファクトリ関数: RssArticle
export function createRssArticle(
  id: string,
  feedId: RssFeedId,
  title: string,
  link: string,
  publishedAt: Date,
  description: string | null = null,
  content: string | null = null,
  author: string | null = null,
  imageUrl: string | null = null
): RssArticle {
  return {
    id: id as RssArticleId,
    feedId,
    title,
    link,
    description,
    content,
    author,
    publishedAt,
    imageUrl
  };
}
