import { notFound } from 'next/navigation';
import { prisma } from '@/prisma/prisma';

export default async function ScrapPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const scrap = await prisma.scrap.findUnique({
      where: { id: params.id },
    });

    if (!scrap) {
      return notFound();
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">スクラップ詳細</h1>
        {/* スクラップの詳細表示 */}
      </div>
    );
  } catch (error) {
    console.error('スクラップ取得エラー:', error);
    return notFound();
  }
}