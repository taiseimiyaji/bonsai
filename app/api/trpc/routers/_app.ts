import { scrapRouter } from './scrap';
import {router} from "@/app/api/trpc/init";
import {scrapBookRouter} from "@/app/api/trpc/routers/scrapBook";
import { rssRouter } from "@/app/api/trpc/routers/rss";
import { todoRouter } from "@/app/api/trpc/routers/todo";

export const appRouter = router({
    scrap: scrapRouter,
    scrapBook: scrapBookRouter,
    rss: rssRouter,
    todo: todoRouter
});

export type AppRouter = typeof appRouter;
