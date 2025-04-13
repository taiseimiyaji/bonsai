// app/lib/trpc.ts
import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import { auth } from "@/auth";

interface CreateContextOptions {
    req?: Request;
}

export const createTRPCContext = async (opts: CreateContextOptions = {}) => {
    const session = await auth();

    return {
        session,
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
    if (!ctx.session || !ctx.session.user) {
        throw new Error('UNAUTHORIZED');
    }
    return next({
        ctx: {
            session: { ...ctx.session, user: ctx.session.user },
        },
    });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
