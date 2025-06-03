// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';
import { appRouter } from "@/app/api/trpc/routers/_app";
import { createTRPCContext } from "@/app/api/trpc/init";

export const runtime = 'nodejs';

const handler = (req: NextRequest) => {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: () => createTRPCContext({ req }),
        onError: ({ error, type, path, input, ctx, req }) => {
            console.error(`TRPC Error on ${type} ${path}:`, {
                code: error.code,
                message: error.message,
                hasSession: !!ctx?.session,
                userId: ctx?.session?.user?.id,
            });
        },
    });
};

export const GET = handler;
export const POST = handler;
