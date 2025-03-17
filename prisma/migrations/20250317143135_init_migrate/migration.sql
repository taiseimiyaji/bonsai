-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ScrapBookStatus" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "RssFeedType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scrap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT,
    "ogpData" JSONB,
    "scrapBookId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scrap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "image" TEXT,
    "status" "ScrapBookStatus" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapbookLink" (
    "id" TEXT NOT NULL,
    "sourceScrapbookId" TEXT NOT NULL,
    "targetScrapbookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapbookLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ScrapCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RssFeed" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "feedType" "RssFeedType" NOT NULL DEFAULT 'PRIVATE',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastFetched" TIMESTAMP(3),

    CONSTRAINT "RssFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RssArticle" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RssArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronExecutionLog" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "executionTimeSeconds" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapbookLink_sourceScrapbookId_targetScrapbookId_key" ON "ScrapbookLink"("sourceScrapbookId", "targetScrapbookId");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapCategory_name_key" ON "ScrapCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RssFeed_url_key" ON "RssFeed"("url");

-- CreateIndex
CREATE INDEX "RssFeed_feedType_idx" ON "RssFeed"("feedType");

-- CreateIndex
CREATE INDEX "RssFeed_userId_idx" ON "RssFeed"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RssArticle_link_key" ON "RssArticle"("link");

-- CreateIndex
CREATE INDEX "RssArticle_feedId_idx" ON "RssArticle"("feedId");

-- CreateIndex
CREATE INDEX "RssArticle_publishedAt_idx" ON "RssArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "CronExecutionLog_jobName_idx" ON "CronExecutionLog"("jobName");

-- CreateIndex
CREATE INDEX "CronExecutionLog_startTime_idx" ON "CronExecutionLog"("startTime");

-- CreateIndex
CREATE INDEX "CronExecutionLog_status_idx" ON "CronExecutionLog"("status");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_scrapBookId_fkey" FOREIGN KEY ("scrapBookId") REFERENCES "ScrapBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ScrapCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapBook" ADD CONSTRAINT "ScrapBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapbookLink" ADD CONSTRAINT "ScrapbookLink_sourceScrapbookId_fkey" FOREIGN KEY ("sourceScrapbookId") REFERENCES "ScrapBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapbookLink" ADD CONSTRAINT "ScrapbookLink_targetScrapbookId_fkey" FOREIGN KEY ("targetScrapbookId") REFERENCES "ScrapBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RssFeed" ADD CONSTRAINT "RssFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RssArticle" ADD CONSTRAINT "RssArticle_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "RssFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
