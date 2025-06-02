// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';
import { appRouter } from "@/app/api/trpc/routers/_app";
import { createTRPCContext } from "@/app/api/trpc/init";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: () => createTRPCContext({ req }),
    });
}

export async function POST(req: NextRequest) {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: () => createTRPCContext({ req }),
    });
}
