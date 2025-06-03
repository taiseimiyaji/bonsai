import { scrapRouter } from './scrap';
import {router} from "@/app/api/trpc/init";
import {scrapBookRouter} from "@/app/api/trpc/routers/scrapBook";
import { rssRouter } from "@/app/api/trpc/routers/rss";
import { todoDddRouter } from "@/app/api/trpc/routers/todo-ddd";

export const appRouter = router({
    scrap: scrapRouter,
    scrapBook: scrapBookRouter,
    rss: rssRouter,
    todo: todoDddRouter // DDD実装に切り替え
});

export type AppRouter = typeof appRouter;
