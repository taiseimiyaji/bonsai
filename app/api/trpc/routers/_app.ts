import { scrapRouter } from './scrap';
import {router} from "@/app/api/trpc/init";
import {scrapBookRouter} from "@/app/api/trpc/routers/scrapBook";

export const appRouter = router({
    scrap: scrapRouter,
    scrapBook: scrapBookRouter
});

export type AppRouter = typeof appRouter;
