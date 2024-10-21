// app/api/trpc/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';
import {appRouter} from "@/app/api/trpc/routers/_app";
import {createTRPCContext} from "@/app/api/trpc/init"; // NextRequestを使う

export const runtime = 'nodejs';

export const handler = (req: NextRequest) => {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req, // reqはNextRequestとして扱う
        router: appRouter,
        createContext: createTRPCContext,
    });
};

export { handler as GET, handler as POST };
