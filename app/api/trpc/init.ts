// app/lib/trpc.ts
import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/app/_utils/next-auth-options';

interface CreateContextOptions {
    req?: Request;
}

export const createTRPCContext = async (opts: CreateContextOptions = {}) => {
    let session = null;

    try {
        // App Router環境では引数なしでgetServerSessionを呼び出す
        session = await getServerSession(nextAuthOptions);
    } catch (error) {
        console.error('Error getting session:', error);
    }

    return { session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
                        ? error.cause.flatten()
                        : null,
            },
        };
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;
