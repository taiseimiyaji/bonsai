import { scrapRouter } from './scrap';
import {router} from "@/app/api/trpc/init";
import {scrapBookRouter} from "@/app/api/trpc/routers/scrapBook";
import { rssRouter } from "@/app/api/trpc/routers/rss";

export const appRouter = router({
    scrap: scrapRouter,
    scrapBook: scrapBookRouter,
    rss: rssRouter
});

export type AppRouter = typeof appRouter;
