'use client';

import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from "./api/trpc/routers/_app";
import { QueryClient } from '@tanstack/react-query';

export const trpc = createTRPCReact<AppRouter>();

// デフォルトのQueryClientを作成
export const queryClient = new QueryClient();
