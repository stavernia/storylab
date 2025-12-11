import { useState } from "react";
import type { Chapter } from "@/App";
import { TiptapChapterEditor } from "./TiptapChapterEditor";
import { useChapterNumbering } from "@/contexts/ChapterNumberingContext";
import { PLACEHOLDERS } from "@/constants/ui";

export type ChapterSectionProps = {
  chapter: Chapter;
  index: number;
  totalChapters: number;
  onChange: (html: string) => void;
  onUpdateTitle?: (id: string, title: string) => void;
  onFocus?: () => void;
};

export function ChapterSection({
  chapter,
  index,
  totalChapters,
  onChange,
  onUpdateTitle,
  onFocus,
}: ChapterSectionProps) {
  const { getChapterNumber } = useChapterNumbering();
  const chapterNumber = getChapterNumber(chapter.id);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(chapter.title || "");

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTitleValue(chapter.title || "");
  };

  const handleTitleSave = () => {
    if (onUpdateTitle && titleValue.trim() !== chapter.title) {
      onUpdateTitle(chapter.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(chapter.title || "");
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  return (
    <section className="mb-16">
      {/* Editable chapter header */}
      <div className="text-center mb-10">
        <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">
          CHAPTER {chapterNumber}
        </div>
        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            maxLength={100}
            placeholder={PLACEHOLDERS.CHAPTER_TITLE}
            autoFocus
            className="text-2xl font-normal text-gray-900 text-center w-full max-w-2xl mx-auto px-2 py-1 border-transparent rounded hover:ring-1 hover:ring-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        ) : (
          <h2
            className="text-2xl font-normal text-gray-900 cursor-pointer px-2 py-1 rounded hover:ring-1 hover:ring-blue-200/50 transition-all inline-block"
            onClick={handleTitleClick}
          >
            {chapter.title || "Untitled"}
          </h2>
        )}
      </div>

      {/* Editable chapter content */}
      <TiptapChapterEditor
        chapterId={chapter.id}
        value={chapter.content || ""}
        onChange={onChange}
        readOnly={false}
      />

      {/* Chapter divider */}
      <div className="h-px bg-gray-200 mt-12 w-24 mx-auto" />
    </section>
  );
}
