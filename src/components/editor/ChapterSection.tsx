import type { Chapter } from '../../App';
import { TiptapChapterEditor } from './TiptapChapterEditor';
import { useChapterNumbering } from '../../contexts/ChapterNumberingContext';

export type ChapterSectionProps = {
  chapter: Chapter;
  index: number;
  totalChapters: number;
  onChange: (html: string) => void;
  onFocus?: () => void;
};

export function ChapterSection({
  chapter,
  index,
  totalChapters,
  onChange,
  onFocus,
}: ChapterSectionProps) {
  const { getChapterNumber } = useChapterNumbering();
  const chapterNumber = getChapterNumber(chapter.id);

  return (
    <section className="mb-16">
      {/* Read-only chapter header */}
      <div className="text-center mb-10">
        <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">
          CHAPTER {chapterNumber}
        </div>
        <h2 className="text-2xl font-normal text-gray-900">
          {chapter.title || 'Untitled'}
        </h2>
      </div>

      {/* Editable chapter content */}
      <TiptapChapterEditor
        chapterId={chapter.id}
        value={chapter.content || ''}
        onChange={onChange}
        readOnly={false}
      />
      
      {/* Chapter divider */}
      <div className="h-px bg-gray-200 mt-12 w-24 mx-auto" />
    </section>
  );
}