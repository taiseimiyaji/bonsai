import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { auth } from "@/auth";

interface CreateContextOptions {
    req?: Request;
}

export const createTRPCContext = async (_opts: CreateContextOptions = {}) => {
    const session = await auth();
    return {
        session,
    };
};

// tRPCの初期化
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

// 認証ミドルウェア
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new Error('UNAUTHORIZED');
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// エクスポートするヘルパー
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
