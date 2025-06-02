import { router } from './index';
import { todoRouter } from './todo/router';

// ルートルーター
export const appRouter = router({
  todo: todoRouter,
  // 他のルーターもここに追加できます
});

// ルーターの型定義をエクスポート
export type AppRouter = typeof appRouter;
