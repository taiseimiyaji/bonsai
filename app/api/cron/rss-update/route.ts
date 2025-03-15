/**
 * RSSフィードを定期的に更新するためのCronジョブAPI
 * このAPIはCloud Runのスケジューラーから定期的に呼び出されることを想定しています
 */
import { NextResponse } from 'next/server';
import { PrismaRssFeedRepository, PrismaRssArticleRepository } from '@/app/types/rss/infrastructure/prisma-repository';
import { RssApplicationService } from '@/app/types/rss/application/rss-application-service';

// リポジトリの初期化
const feedRepository = new PrismaRssFeedRepository();
const articleRepository = new PrismaRssArticleRepository();

// アプリケーションサービスの初期化
const rssService = new RssApplicationService(feedRepository, articleRepository);

// 認証用のシークレットキー（環境変数から取得）
const API_SECRET = process.env.CRON_API_SECRET;

export async function GET(request: Request) {
  try {
    // リクエストからAuthorizationヘッダーを取得
    const authHeader = request.headers.get('Authorization');
    
    // 簡易的な認証（本番環境ではより堅牢な認証が必要）
    if (!API_SECRET || authHeader !== `Bearer ${API_SECRET}`) {
      return NextResponse.json(
        { error: '認証に失敗しました' },
        { status: 401 }
      );
    }

    // すべてのRSSフィードを更新
    const result = await rssService.updateAllFeeds();
    
    if (!result.ok) {
      console.error('RSSフィード更新エラー:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.value}件の新しい記事を取得しました`,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cronジョブエラー:', error);
    return NextResponse.json(
      { error: 'RSSフィードの更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
