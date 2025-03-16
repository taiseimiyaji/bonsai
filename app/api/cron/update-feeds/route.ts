/**
 * RSSフィードを定期的に更新するためのAPI Route
 * Google Cloud Scheduler等から定期的に呼び出すことを想定
 */
import { NextRequest, NextResponse } from 'next/server';
import { RssApplicationService } from '@/app/types/rss/application/rss-application-service';
import { PrismaRssFeedRepository, PrismaRssArticleRepository } from '@/app/types/rss/infrastructure/prisma-repository';
import { prisma } from '@/prisma/prisma';

// 認証用のシークレットキー（環境変数から取得）
const API_SECRET_KEY = process.env.CRON_API_SECRET_KEY;

// リポジトリの初期化
const feedRepository = new PrismaRssFeedRepository();
const articleRepository = new PrismaRssArticleRepository();

// アプリケーションサービスの初期化
const rssService = new RssApplicationService(feedRepository, articleRepository);

/**
 * RSSフィードを更新するハンドラー
 * GET /api/cron/update-feeds
 */
export async function GET(request: NextRequest) {
  try {
    // APIキーによる認証
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    // 認証チェック（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      if (!API_SECRET_KEY) {
        console.error('環境変数 CRON_API_SECRET_KEY が設定されていません');
        return NextResponse.json(
          { error: '認証設定エラー' },
          { status: 500 }
        );
      }
      
      if (!apiKey || apiKey !== API_SECRET_KEY) {
        return NextResponse.json(
          { error: '認証エラー' },
          { status: 401 }
        );
      }
    }
    
    // 更新開始時刻
    const startTime = new Date();
    console.log(`[${startTime.toISOString()}] フィード更新処理を開始します`);
    
    // すべてのフィードを更新
    const result = await rssService.updateAllFeeds();
    
    if (!result.ok) {
      console.error('フィード更新エラー:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }
    
    // 更新完了時刻と実行時間
    const endTime = new Date();
    const executionTime = (endTime.getTime() - startTime.getTime()) / 1000;
    
    console.log(`[${endTime.toISOString()}] フィード更新処理が完了しました（${executionTime}秒）`);
    console.log(`更新されたフィード数: ${result.value}`);
    
    // 実行ログをDBに保存
    await prisma.cronExecutionLog.create({
      data: {
        jobName: 'update-feeds',
        startTime,
        endTime,
        executionTimeSeconds: executionTime,
        status: 'SUCCESS',
        details: `更新されたフィード数: ${result.value}`
      }
    });
    
    return NextResponse.json({
      success: true,
      updatedFeeds: result.value,
      executionTime: `${executionTime}秒`
    });
  } catch (error) {
    console.error('予期しないエラー:', error);
    
    // エラーログをDBに保存
    try {
      await prisma.cronExecutionLog.create({
        data: {
          jobName: 'update-feeds',
          startTime: new Date(),
          endTime: new Date(),
          executionTimeSeconds: 0,
          status: 'ERROR',
          details: `エラー: ${(error as Error).message}`
        }
      });
    } catch (logError) {
      console.error('ログ保存エラー:', logError);
    }
    
    return NextResponse.json(
      { error: `予期しないエラーが発生しました: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
