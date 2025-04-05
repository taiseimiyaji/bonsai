/**
 * 記事一覧コンポーネント
 */
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { trpc } from '../../../trpc-client';
import { useSession } from 'next-auth/react';
import { FaLink, FaMarkdown, FaHeading, FaBookmark, FaTimes, FaCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Article {
  id: string;
  title: string;
  description: string | null;
  link: string;
  publishedAt: string;
  author: string | null;
  imageUrl: string | null;
  timeAgo: string;
  feedId: string;
  isRead?: boolean;
  feed?: {
    title: string;
    id: string;
  };
}

interface ArticleListProps {
  articles: Article[];
  isZennFeed?: boolean; // Zennのフィードかどうかを示すフラグ
  onArticleRead?: (articleId: string) => void; // 記事が既読になった時のコールバック
}

export default function ArticleList({ articles, isZennFeed = false, onArticleRead }: ArticleListProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const router = useRouter();
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [readArticles, setReadArticles] = useState<Set<string>>(
    new Set(articles.filter(article => article.isRead).map(article => article.id))
  );
  const [showScrapModal, setShowScrapModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
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
    onSuccess: (_, variables) => {
      // 成功時に既読状態を更新
      setReadArticles(prev => {
        const newSet = new Set(prev);
        newSet.add(variables.articleId);
        return newSet;
      });
      
      // 親コンポーネントに通知
      if (onArticleRead) {
        onArticleRead(variables.articleId);
      }
    }
  });
  
  // 記事の展開/折りたたみを切り替える
  const toggleArticle = (articleId: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };
  
  // 記事を既読にする
  const markAsRead = (articleId: string, e: React.MouseEvent) => {
    e.preventDefault(); // リンククリックのデフォルト動作を防止
    
    if (!isLoggedIn) return; // ログインしていない場合は何もしない
    
    // 既に既読の場合は何もしない
    if (readArticles.has(articleId)) return;
    
    // 既読にするAPIを呼び出す
    markAsReadMutation.mutate({ articleId });
  };
  
  // 記事を開く際に既読にする関数
  const openArticle = (article: Article, e: React.MouseEvent) => {
    e.preventDefault();
    
    // ログイン済みの場合のみ既読にする
    if (isLoggedIn && !readArticles.has(article.id)) {
      markAsReadMutation.mutate({ articleId: article.id });
    }
    
    // 記事を新しいタブで開く
    window.open(article.link, '_blank', 'noopener,noreferrer');
  };
  
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
  const openScrapModal = (article: Article) => {
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
  
  return (
    <div className="space-y-6">
      {articles.map((article) => {
        const isExpanded = expandedArticles.has(article.id);
        const isRead = readArticles.has(article.id) || article.isRead;
        
        return (
          <article 
            key={article.id} 
            className={`border ${isRead ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 'border-gray-200 dark:border-gray-700'} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition`}
          >
            <div className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 記事画像（あれば表示） */}
                {article.imageUrl && (
                  <div className={`flex-shrink-0 ${isZennFeed ? 'md:w-1/4' : 'md:w-1/4'}`}>
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded"
                      onClick={(e) => openArticle(article, e)}
                    >
                      <div className={`relative ${isZennFeed ? 'aspect-[1.91/1] w-full' : 'h-40 w-full'}`}>
                        {/* 画像URLが有効かどうかを確認 */}
                        {(() => {
                          try {
                            // URLが有効かチェック
                            new URL(article.imageUrl);
                            return (
                              <Image
                                src={article.imageUrl}
                                alt={article.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 25vw"
                                className={`${isZennFeed ? 'object-contain' : 'object-cover'}`}
                                onError={(e) => {
                                  // 画像読み込みエラー時に非表示
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.style.display = 'none';
                                  }
                                }}
                              />
                            );
                          } catch (e) {
                            // 無効なURLの場合は何も表示しない
                            return null;
                          }
                        })()}
                      </div>
                    </a>
                  </div>
                )}
                
                {/* 記事情報 */}
                <div className={article.imageUrl ? "md:w-3/4" : "w-full"}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-xl font-semibold flex items-center ${isRead ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                      {isLoggedIn && !isRead && (
                        <span className="text-blue-500 mr-2 flex-shrink-0" title="未読">
                          <FaCircle size={10} />
                        </span>
                      )}
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`hover:text-blue-600 dark:hover:text-blue-400 ${isRead ? 'visited:text-gray-500 dark:visited:text-gray-400' : ''}`}
                        onClick={(e) => openArticle(article, e)}
                      >
                        {article.title}
                      </a>
                    </h3>
                  </div>
                  
                  {article.description && (
                    <div 
                      className={`text-gray-600 dark:text-gray-300 mb-3 ${isExpanded ? '' : 'line-clamp-3'} ${isRead ? 'opacity-80' : ''}`}
                      dangerouslySetInnerHTML={{ __html: article.description }}
                    />
                  )}
                  
                  <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-x-4 gap-y-1">
                    {article.feed?.title && (
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        {article.feed.title}
                      </span>
                    )}
                    
                    {article.author && (
                      <span>
                        著者: {article.author}
                      </span>
                    )}
                    
                    <span>{article.timeAgo}</span>
                    
                    <button
                      onClick={() => toggleArticle(article.id)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {isExpanded ? '折りたたむ' : 'もっと見る'}
                    </button>
                    
                    {/* コピー・保存ボタン */}
                    <div className="flex items-center space-x-3 ml-auto">
                      <button
                        onClick={() => copyMarkdownLink(article.title, article.link)}
                        className="text-gray-600 dark:text-gray-300 hover:opacity-80 transition-opacity"
                        aria-label="Markdownリンクをコピー"
                        title="Markdownリンクをコピー"
                      >
                        <FaMarkdown size={16} />
                      </button>
                      <button
                        onClick={() => copyLinkOnly(article.link)}
                        className="text-gray-600 dark:text-gray-300 hover:opacity-80 transition-opacity"
                        aria-label="リンクをコピー"
                        title="リンクをコピー"
                      >
                        <FaLink size={16} />
                      </button>
                      <button
                        onClick={() => copyTitleOnly(article.title)}
                        className="text-gray-600 dark:text-gray-300 hover:opacity-80 transition-opacity"
                        aria-label="タイトルをコピー"
                        title="タイトルをコピー"
                      >
                        <FaHeading size={16} />
                      </button>
                      {isLoggedIn && (
                        <button
                          onClick={() => openScrapModal(article)}
                          className="text-yellow-500 hover:opacity-80 transition-opacity"
                          aria-label="スクラップに保存"
                          title="スクラップに保存"
                        >
                          <FaBookmark size={16} />
                        </button>
                      )}
                    </div>
                    
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => openArticle(article, e)}
                    >
                      記事を読む
                    </a>
                    
                    {isLoggedIn && !isRead && (
                      <button
                        onClick={() => markAsReadMutation.mutate({ articleId: article.id })}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        disabled={markAsReadMutation.isLoading}
                      >
                        既読にする
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
      
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
