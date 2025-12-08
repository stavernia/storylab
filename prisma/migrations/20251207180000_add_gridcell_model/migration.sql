-- CreateTable
CREATE TABLE "GridCell" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "presence" BOOLEAN NOT NULL DEFAULT false,
    "intensity" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "threadRole" TEXT,

    CONSTRAINT "GridCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GridCell_bookId_chapterId_themeId_key" ON "GridCell"("bookId", "chapterId", "themeId");

-- CreateIndex
CREATE INDEX "GridCell_bookId_idx" ON "GridCell"("bookId");

-- CreateIndex
CREATE INDEX "GridCell_chapterId_idx" ON "GridCell"("chapterId");

-- CreateIndex
CREATE INDEX "GridCell_themeId_idx" ON "GridCell"("themeId");

-- AddForeignKey
ALTER TABLE "GridCell" ADD CONSTRAINT "GridCell_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GridCell" ADD CONSTRAINT "GridCell_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GridCell" ADD CONSTRAINT "GridCell_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
