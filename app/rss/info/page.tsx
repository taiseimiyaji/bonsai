/**
 * RSSリーダーのInfoページ - 収集した記事の一覧表示
 */
'use client';

import { InfoPageContent } from './_components/InfoPageContent';

// Next.jsのページコンポーネント
export default function Page() {
  return <InfoPageContent isTopPage={false} />;
}
