/**
 * RSS機能の共通ユーティリティ関数
 */
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 記事データの整形
 */
export const formatArticle = (article: any) => {
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

/**
 * フィードデータの整形
 */
export const formatFeed = (feed: any) => {
  return {
    ...feed,
    lastFetched: feed.lastFetched ? feed.lastFetched.toISOString() : null,
    createdAt: feed.createdAt ? feed.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: feed.updatedAt ? feed.updatedAt.toISOString() : new Date().toISOString(),
  };
};
