-- CreateTable
CREATE TABLE "RssReadStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT true,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RssReadStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RssReadStatus_userId_idx" ON "RssReadStatus"("userId");

-- CreateIndex
CREATE INDEX "RssReadStatus_articleId_idx" ON "RssReadStatus"("articleId");

-- CreateIndex
CREATE INDEX "RssReadStatus_isRead_idx" ON "RssReadStatus"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "RssReadStatus_userId_articleId_key" ON "RssReadStatus"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "RssReadStatus" ADD CONSTRAINT "RssReadStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RssReadStatus" ADD CONSTRAINT "RssReadStatus_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "RssArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
