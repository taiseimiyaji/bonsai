/**
 * RSS機能の型定義
 */
import { inferAsyncReturnType } from '@trpc/server';
import { createTRPCContext } from "@/app/api/trpc/init";

// 基本のコンテキスト型
export type Context = inferAsyncReturnType<typeof createTRPCContext>;

// 認証済みコンテキストの型
export interface AuthenticatedContext extends Context {
  userId: string;
  isAdmin: boolean;
}

// セッションの型
export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  expires: string;
}
