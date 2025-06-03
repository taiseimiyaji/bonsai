// app/lib/trpc-server.ts
import { appRouter } from '@/app/api/trpc/routers/_app';
import { createTRPCContext } from '@/app/api/trpc/init';
import { headers } from 'next/headers';

export async function trpcCaller<T>(callback: (caller: ReturnType<typeof appRouter['createCaller']>) => Promise<T>): Promise<T> {
    // サーバーコンポーネントから呼び出す場合、headers を取得
    const requestHeaders = await headers();
    const fakeRequest = new Request('http://localhost:3000', {
        headers: requestHeaders,
    });
    
    const context = await createTRPCContext({ req: fakeRequest });
    const caller = appRouter.createCaller(context);
    return callback(caller);
}

// サーバーサイドでのtrpcクライアント
export const serverClient = {
    rss: {
        getPublicFeeds: async () => {
            return trpcCaller(caller => caller.rss.getPublicFeeds());
        },
        updateAllFeeds: async () => {
            return trpcCaller(caller => caller.rss.updateAllFeeds());
        },
        getUserFeeds: async () => {
            return trpcCaller(caller => caller.rss.getUserFeeds());
        }
    }
};
