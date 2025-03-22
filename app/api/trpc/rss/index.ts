/**
 * RSSリーダー機能のtRPCルーター
 */
import { router } from "@/app/api/trpc/init";

// 記事関連のプロシージャ
import {
  getPublicArticles,
  getUserArticles,
  getFeedArticles,
  markAsRead,
  getReadStatuses
} from './articles';

// フィード関連のプロシージャ
import {
  addFeed,
  addPublicFeed,
  deleteFeed,
  getUserFeeds,
  getPublicFeeds,
  updateAllFeeds,
  updateFeed
} from './feeds';

/**
 * RSSルーター
 */
export const rssRouter = router({
  // 記事関連
  getPublicArticles,
  getUserArticles,
  getFeedArticles,
  markAsRead,
  getReadStatuses,
  
  // フィード関連
  addFeed,
  addPublicFeed,
  deleteFeed,
  getUserFeeds,
  getPublicFeeds,
  updateAllFeeds,
  updateFeed,
});
