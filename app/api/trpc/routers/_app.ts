import { scrapRouter } from './scrap';
import {router} from "@/app/api/trpc/init";

export const appRouter = router({
    scrap: scrapRouter,
});

export type AppRouter = typeof appRouter;
