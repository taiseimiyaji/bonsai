// app/lib/trpc-server.ts
import { appRouter } from '@/app/api/trpc/routers/_app';
import { createTRPCContext } from '@/app/api/trpc/init';

export async function trpcCaller<T>(callback: (caller: ReturnType<typeof appRouter['createCaller']>) => Promise<T>): Promise<T> {
    const context = await createTRPCContext();
    const caller = appRouter.createCaller(context);
    return callback(caller);
}
