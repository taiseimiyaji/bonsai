import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

// tRPCの初期化
const t = initTRPC.create({
  transformer: superjson,
});

// エクスポートするヘルパー
export const router = t.router;
export const publicProcedure = t.procedure;
