/**
 * RSS機能の型定義
 */
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';

// コンテキストの型拡張
declare module '@trpc/server' {
  interface CreateContextOptions {
    // 既存のプロパティに加えて
    userId?: string;
    isAdmin?: boolean;
  }
}

// セッションの型
export interface Session {
  user: {
    name: string;
    email: string;
    image?: string;
  };
  userId: string;
  expires: string;
}
