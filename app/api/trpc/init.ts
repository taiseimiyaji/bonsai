// app/lib/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { auth } from "@/auth";
import { cookies } from 'next/headers';

interface CreateContextOptions {
    req?: Request;
}

export const createTRPCContext = async (opts: CreateContextOptions = {}) => {
    // Auth.js v5 では cookies を通じてセッションを取得
    const session = await auth();
    
    // デバッグログ
    if (!session) {
        const cookieStore = await cookies();
        console.log('TRPC Context - No session found', {
            hasCookies: true,
            cookiesList: cookieStore.getAll().map(c => c.name),
        });
    } else {
        console.log('TRPC Context - Session found:', {
            userId: session.user?.id,
            userEmail: session.user?.email,
        });
    }

    return {
        session,
        req: opts.req,
    };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError ? error.cause.flatten() : null,
            },
        };
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.session) {
        console.error('TRPC Auth Error: No session found');
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Unauthorized User: No session found',
        });
    }
    
    if (!ctx.session.user) {
        console.error('TRPC Auth Error: No user in session');
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Unauthorized User: No user in session',
        });
    }
    
    if (!ctx.session.user.id) {
        console.error('TRPC Auth Error: No user ID in session', ctx.session);
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Unauthorized User: Invalid session data',
        });
    }
    
    return next({
        ctx: {
            session: { ...ctx.session, user: ctx.session.user },
        },
    });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
