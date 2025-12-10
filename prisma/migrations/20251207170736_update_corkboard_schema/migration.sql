-- CreateTable
CREATE TABLE "CorkboardBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookId" TEXT NOT NULL,

    CONSTRAINT "CorkboardBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorkboardCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "notes" TEXT,
    "status" TEXT,
    "color" TEXT,
    "laneRank" TEXT NOT NULL,
    "wordEstimate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "x" INTEGER,
    "y" INTEGER,
    "scope" TEXT,
    "chapterId" TEXT,
    "partId" TEXT,
    "boardId" TEXT,
    "bookId" TEXT NOT NULL,

    CONSTRAINT "CorkboardCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CorkboardBoard_bookId_idx" ON "CorkboardBoard"("bookId");

-- CreateIndex
CREATE INDEX "CorkboardCard_bookId_idx" ON "CorkboardCard"("bookId");

-- CreateIndex
CREATE INDEX "CorkboardCard_boardId_idx" ON "CorkboardCard"("boardId");

-- CreateIndex
CREATE INDEX "CorkboardCard_chapterId_idx" ON "CorkboardCard"("chapterId");

-- AddForeignKey
ALTER TABLE "CorkboardBoard" ADD CONSTRAINT "CorkboardBoard_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorkboardCard" ADD CONSTRAINT "CorkboardCard_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorkboardCard" ADD CONSTRAINT "CorkboardCard_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorkboardCard" ADD CONSTRAINT "CorkboardCard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "CorkboardBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorkboardCard" ADD CONSTRAINT "CorkboardCard_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
