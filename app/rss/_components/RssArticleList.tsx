/**
 * RSSの記事一覧を表示するコンポーネント
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { trpc } from '@/app/lib/trpc-client';
import { FaLink, FaMarkdown, FaHeading, FaBookmark, FaTimes, FaCircle, FaFilter } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface RssArticleListProps {
  isLoggedIn: boolean;
}

export default function RssArticleList({ isLoggedIn }: RssArticleListProps) {
  const [limit, setLimit] = useState(20);
  const { data: session } = useSession();
  const router = useRouter();
  const [showScrapModal, setShowScrapModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  // 既読/未読フィルター用のステート
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  
  // スクラップブック一覧を取得
  const scrapBooksQuery = trpc.scrapBook.getScrapBooks.useQuery(undefined, {
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
  
  // スクラップ作成のミューテーション
  const addScrapMutation = trpc.scrap.addScrap.useMutation({
    onSuccess: () => {
      toast.success('スクラップに保存しました');
      setShowScrapModal(false);
      setSelectedArticle(null);
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    }
  });
  
  // 記事を既読にするミューテーション
  const markAsReadMutation = trpc.rss.markAsRead.useMutation({
    onSuccess: () => {
      // 記事一覧を再取得（既読状態を更新するため）
      articlesQuery.refetch();
    },
    onError: (error) => {
      console.error('既読マークに失敗しました:', error);
    }
  });
  
  // ログイン状態に応じて適切なクエリを使用
  const articlesQuery = isLoggedIn
    ? trpc.rss.getUserArticles.useQuery({ 
        limit,
        readFilter // 既読/未読フィルターを追加
      })
    : trpc.rss.getPublicArticles.useQuery({ limit });
  
  if (articlesQuery.isLoading) {
    return <div className="py-4">記事を読み込み中...</div>;
  }
  
  if (articlesQuery.isError) {
    return (
      <div className="py-4 text-red-500">
        エラーが発生しました: {articlesQuery.error.message}
      </div>
    );
  }
  
  const articles = articlesQuery.data || [];
  
  if (articles.length === 0) {
    return (
      <div className="py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {isLoggedIn && readFilter !== 'all' 
            ? `${readFilter === 'read' ? '既読' : '未読'}の記事がありません。`
            : '表示できる記事が登録されていません。'}
          {isLoggedIn && readFilter === 'all' && ' フィードを追加してください。'}
        </p>
      </div>
    );
  }

  // URLをクリップボードにコピーする関数
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(`${type}をコピーしました`);
      })
      .catch((err) => {
        console.error(`${type}のコピーに失敗しました:`, err);
        toast.error(`${type}のコピーに失敗しました`);
      });
  };

  // Markdownフォーマットでリンクをコピーする関数
  const copyMarkdownLink = (title: string, url: string) => {
    const markdownLink = `[${title}](${url})`;
    copyToClipboard(markdownLink, 'Markdownリンク');
  };

  // リンクだけをコピーする関数
  const copyLinkOnly = (url: string) => {
    copyToClipboard(url, 'リンク');
  };

  // タイトルだけをコピーする関数
  const copyTitleOnly = (title: string) => {
    copyToClipboard(title, 'タイトル');
  };

  // スクラップモーダルを表示する関数
  const openScrapModal = (article: typeof articles[0]) => {
    if (!session || !session.userId) {
      toast.error('スクラップを保存するにはログインが必要です');
      return;
    }

    setSelectedArticle(article);
    setShowScrapModal(true);
  };

  // スクラップを保存する関数
  const saveToScrap = (scrapBookId: string) => {
    if (!selectedArticle || !session?.userId) return;

    addScrapMutation.mutate({
      scrapBookId,
      content: `RSS記事: ${selectedArticle.title}\n${selectedArticle.link}`,
      categoryId: null
    });
  };
  
  // 記事を開く際に既読にする関数
  const openArticle = (article: typeof articles[0]) => {
    // ログイン済みの場合のみ既読にする
    if (isLoggedIn && session?.userId) {
      markAsReadMutation.mutate({ articleId: article.id });
    }
    
    // 記事を新しいタブで開く
    window.open(article.link, '_blank', 'noopener,noreferrer');
  };
  
  // フィルターを変更する関数
  const changeReadFilter = (filter: 'all' | 'read' | 'unread') => {
    setReadFilter(filter);
  };
  
  return (
    <div>
      {/* フィルターコントロール（ログイン済みの場合のみ表示） */}
      {isLoggedIn && (
        <div className="mb-4 flex items-center">
          <span className="mr-2 flex items-center">
            <FaFilter className="mr-1" /> フィルター:
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => changeReadFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                readFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => changeReadFilter('unread')}
              className={`px-3 py-1 rounded text-sm ${
                readFilter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              未読のみ
            </button>
            <button
              onClick={() => changeReadFilter('read')}
              className={`px-3 py-1 rounded text-sm ${
                readFilter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              既読のみ
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {articles.map((article) => (
          <article 
            key={article.id} 
            className={`border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 ${article.isRead ? 'opacity-80' : ''}`}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* 記事画像（あれば表示） */}
              {article.imageUrl && (
                <div className="md:w-1/4 flex-shrink-0">
                  <a 
                    onClick={(e) => {
                      e.preventDefault();
                      openArticle(article);
                    }}
                    href={article.link}
                    className="block overflow-hidden rounded cursor-pointer"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover"
                        onError={(e) => {
                          // 画像読み込みエラー時に非表示
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </a>
                </div>
              )}
              
              {/* 記事情報 */}
              <div className={article.imageUrl ? "md:w-3/4" : "w-full"}>
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                  {isLoggedIn && !article.isRead && (
                    <span className="text-blue-500 mr-2 flex-shrink-0" title="未読">
                      <FaCircle size={10} />
                    </span>
                  )}
                  <a 
                    onClick={(e) => {
                      e.preventDefault();
                      openArticle(article);
                    }}
                    href={article.link}
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    {article.title}
                  </a>
                </h3>
                
                {article.description && (
                  <div 
                    className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: article.description }}
                  />
                )}
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  {article.author && (
                    <span className="mr-3">
                      著者: {article.author}
                    </span>
                  )}
                  <span>{article.timeAgo}</span>
                </div>

                {/* コピー・保存ボタン */}
                <div className="mt-3 flex items-center space-x-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">共有:</span>
                  <button
                    onClick={() => copyMarkdownLink(article.title, article.link)}
                    className="text-gray-600 dark:text-gray-300 hover:opacity-80 transition-opacity"
                    aria-label="Markdownリンクをコピー"
                    title="Markdownリンクをコピー"
                  >
                    <FaMarkdown size={18} />
                  </button>
                  <button
                    onClick={() => copyLinkOnly(article.link)}
                    className="text-gray-600 dark:text-gray-300 hover:opacity-80 transition-opacity"
                    aria-label="リンクをコピー"
                    title="リンクをコピー"
                  >
                    <FaLink size={18} />
                  </button>
                  <button
                    onClick={() => copyTitleOnly(article.title)}
                    className="text-gray-600 dark:text-gray-300 hover:opacity-80 transition-opacity"
                    aria-label="タイトルをコピー"
                    title="タイトルをコピー"
                  >
                    <FaHeading size={18} />
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={() => openScrapModal(article)}
                      className="text-yellow-500 hover:opacity-80 transition-opacity"
                      aria-label="スクラップに保存"
                      title="スクラップに保存"
                    >
                      <FaBookmark size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      {/* もっと読み込むボタン */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setLimit(prev => prev + 20)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          disabled={articlesQuery.isLoading}
        >
          もっと読み込む
        </button>
      </div>

      {/* スクラップブック選択モーダル */}
      {showScrapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">スクラップブックを選択</h3>
              <button 
                onClick={() => {
                  setShowScrapModal(false);
                  setSelectedArticle(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {scrapBooksQuery.isLoading ? (
              <div className="py-4 text-center">スクラップブックを読み込み中...</div>
            ) : scrapBooksQuery.isError ? (
              <div className="py-4 text-center text-red-500">
                エラーが発生しました: {scrapBooksQuery.error.message}
              </div>
            ) : scrapBooksQuery.data?.length === 0 ? (
              <div className="py-4 text-center">
                <p className="mb-4">スクラップブックがありません。新しく作成してください。</p>
                <button
                  onClick={() => router.push('/scrap/book/new')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  スクラップブックを作成
                </button>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {scrapBooksQuery.data?.map((book) => (
                    <li key={book.id}>
                      <button
                        onClick={() => saveToScrap(book.id)}
                        className="w-full text-left p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        disabled={addScrapMutation.isLoading}
                      >
                        <div className="font-medium">{book.title}</div>
                        {book.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {book.description}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowScrapModal(false);
                  setSelectedArticle(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition mr-2"
              >
                キャンセル
              </button>
              <button
                onClick={() => router.push('/scrap/book/new')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                新規作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
