import { createContext, useContext, useMemo } from 'react';
import type { Chapter, Part } from '@/App';
import type { Book } from '@/types/book';
import { calculateChapterNumbers, calculatePartNumbers, type ChapterNumberingMode } from '@/utils/chapter-numbering';

interface ChapterNumberingContextValue {
  getChapterNumber: (chapterId: string) => number;
  getPartNumber: (partId: string) => number;
  mode: ChapterNumberingMode;
}

const ChapterNumberingContext = createContext<ChapterNumberingContextValue | null>(null);

export function ChapterNumberingProvider({
  children,
  chapters,
  parts,
  currentBook,
}: {
  children: React.ReactNode;
  chapters: Chapter[];
  parts: Part[];
  currentBook: Book | null;
}) {
  const mode: ChapterNumberingMode = currentBook?.chapterNumbering || 'per-book';

  const chapterNumberMap = useMemo(() => {
    return calculateChapterNumbers(chapters, parts, mode);
  }, [chapters, parts, mode]);

  const partNumberMap = useMemo(() => {
    return calculatePartNumbers(parts);
  }, [parts]);

  const getChapterNumber = (chapterId: string) => {
    return chapterNumberMap.get(chapterId) || 1;
  };

  const getPartNumber = (partId: string) => {
    return partNumberMap.get(partId) || 1;
  };

  return (
    <ChapterNumberingContext.Provider value={{ getChapterNumber, getPartNumber, mode }}>
      {children}
    </ChapterNumberingContext.Provider>
  );
}

export function useChapterNumbering() {
  const context = useContext(ChapterNumberingContext);
  if (!context) {
    throw new Error('useChapterNumbering must be used within ChapterNumberingProvider');
  }
  return context;
}