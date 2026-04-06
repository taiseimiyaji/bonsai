// Why: canonical appRouter is defined in app/api/trpc/routers/_app.ts
// This re-export exists to avoid duplicate definitions.
export { appRouter, type AppRouter } from '@/app/api/trpc/routers/_app';
