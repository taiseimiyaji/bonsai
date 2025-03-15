/**
 * RSSリーダー機能のリポジトリインターフェース
 */
import { Result, RssFeed, RssArticle, DomainError, RssUrl } from './domain';

// リポジトリインターフェース
export interface RssFeedRepository {
  // フィード関連
  findById(id: string): Promise<Result<RssFeed | null, DomainError>>;
  findByUrl(url: RssUrl): Promise<Result<RssFeed | null, DomainError>>;
  findAll(): Promise<Result<RssFeed[], DomainError>>;
  findPublicFeeds(): Promise<Result<RssFeed[], DomainError>>;
  findUserFeeds(userId: string): Promise<Result<RssFeed[], DomainError>>;
  save(feed: RssFeed): Promise<Result<RssFeed, DomainError>>;
  update(feed: RssFeed): Promise<Result<RssFeed, DomainError>>;
  delete(id: string): Promise<Result<boolean, DomainError>>;
  updateLastFetched(id: string, lastFetched: Date): Promise<Result<RssFeed, DomainError>>;
}

export interface RssArticleRepository {
  // 記事関連
  findById(id: string): Promise<Result<RssArticle | null, DomainError>>;
  findByLink(link: string): Promise<Result<RssArticle | null, DomainError>>;
  findByFeedId(feedId: string): Promise<Result<RssArticle[], DomainError>>;
  findLatestArticles(limit: number): Promise<Result<RssArticle[], DomainError>>;
  findLatestPublicArticles(limit: number): Promise<Result<RssArticle[], DomainError>>;
  findLatestUserArticles(userId: string, limit: number): Promise<Result<RssArticle[], DomainError>>;
  save(article: RssArticle): Promise<Result<RssArticle, DomainError>>;
  saveMany(articles: RssArticle[]): Promise<Result<RssArticle[], DomainError>>;
}
