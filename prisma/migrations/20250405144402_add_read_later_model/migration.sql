-- CreateTable
CREATE TABLE "ReadLater" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadLater_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadLater_userId_idx" ON "ReadLater"("userId");

-- CreateIndex
CREATE INDEX "ReadLater_articleId_idx" ON "ReadLater"("articleId");

-- CreateIndex
CREATE INDEX "ReadLater_addedAt_idx" ON "ReadLater"("addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReadLater_userId_articleId_key" ON "ReadLater"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "ReadLater" ADD CONSTRAINT "ReadLater_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadLater" ADD CONSTRAINT "ReadLater_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "RssArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
