-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagLink" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_bookId_idx" ON "Tag"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_bookId_name_key" ON "Tag"("bookId", "name");

-- CreateIndex
CREATE INDEX "TagLink_bookId_idx" ON "TagLink"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "TagLink_tagId_entityType_entityId_key" ON "TagLink"("tagId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagLink" ADD CONSTRAINT "TagLink_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagLink" ADD CONSTRAINT "TagLink_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
