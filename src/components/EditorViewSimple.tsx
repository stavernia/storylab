import { useState, useEffect } from 'react';
import { RichTextEditor } from './editor/RichTextEditor';
import { BookOpenText } from 'lucide-react';
import type { Chapter, Part } from '@/App';
import { useInspector } from '@/contexts/InspectorContext';
import { EditorProjectInfoPanel } from './info-panels/EditorProjectInfoPanel';
import { ChapterData } from '@/services/chapter';
import { tagService, Tag } from '@/services/tag';
import { useTagFilter } from '@/contexts/TagFilterContext';
import { useEntityTags } from '@/hooks/useEntityTags';
import { toast } from 'sonner';
import { corkboardApi } from "@/api/corkboard";
import { X } from 'lucide-react';

type EditorViewProps = {
  bookId?: string;
  chapters: Chapter[];  // Pre-filtered chapters from BinderWrapper
  currentChapterId: string;
  setCurrentChapterId: (id: string) => void;
  updateChapter: (id: string, content: string) => void;
  addChapter: (title?: string) => Promise<string>;
  deleteChapter: (id: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterDetails: (id: string, updates: Partial<Chapter>) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  parts?: Part[];
};

export function EditorView({
  bookId,
  chapters,
  currentChapterId,
  setCurrentChapterId,
  updateChapter,
  addChapter,
  deleteChapter,
  updateChapterTitle,
  updateChapterDetails,
  reorderChapters,
  parts,
}: EditorViewProps) {
  const [showFilterBanner, setShowFilterBanner] = useState(true);

  // NEW: Inspector v2
  const { openInspector } = useInspector();

  // Tag filtering for current chapter
  const { matches, isActive } = useTagFilter();

  // Determine display mode
  const isSingleChapter = chapters.length === 1;
  const currentChapter = chapters[0];
  const { tags: currentTags } = useEntityTags('chapter', currentChapter?.id || '');

  // Check if current chapter is hidden by filters
  const currentHidden = isActive && currentTags && !matches(currentTags);

  // NEW: Multi-Chapter View - Handler for updating chapter content
  const handleChapterContentChange = (chapterId: string, newContent: string) => {
    updateChapter(chapterId, newContent);
  };

  // NEW: Board Mini-Pack - Handler to create board card from current chapter
  const handleCreateBoardCardForCurrentChapter = async () => {
    if (!currentChapter) return;
    if (!bookId) {
      toast.error('Select a book before creating a board card');
      return;
    }

    try {
      const { alreadyExists } = await corkboardApi.createCardFromChapter(
        currentChapter,
        bookId,
      );
      if (alreadyExists) {
        toast.success('This chapter is already on the board');
      } else {
        toast.success('Card added to board!');
      }
    } catch (error) {
      console.error('Failed to create board card from chapter:', error);
      toast.error('Failed to add card to board');
    }
  };

  // NEW: Inspector v2 - Handler for chapter info from toolbar or editor
  const handleOpenChapterInspector = async (chapter: Chapter) => {
    // Load tags for this chapter
    let tags: Tag[] = [];
    try {
      tags = await tagService.listForEntity('chapter', chapter.id);
    } catch (error) {
      console.error('Failed to load chapter tags:', error);
    }
    
    // Phase 1.5: Use NEW structured data API
    openInspector({
      type: 'chapter',
      id: chapter.id,
      data: {
        chapter: chapter as ChapterData,
        tags,
        parts: parts || [],
      }
    }, 'inspector');
  };

  // NEW: Inspector v2 - Handler for current chapter info from toolbar
  const handleOpenCurrentChapterInfo = async () => {
    if (!currentChapter) return;
    await handleOpenChapterInspector(currentChapter);
  };

  // NEW: Inspector v2 - Handler for project info
  const handleOpenProjectInfo = () => {
    openInspector({
      title: 'Manuscript overview',
      subtitle: 'Project-wide stats',
      icon: <BookOpenText className="w-4 h-4" />,
      content: <EditorProjectInfoPanel chapters={chapters} />,
    });
  };

  if (!currentChapter) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No chapters to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter Warning Banner */}
      {currentHidden && showFilterBanner && isSingleChapter && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-yellow-800">
            This chapter is hidden by tag filters. Clear filters to edit.
          </p>
          <button
            onClick={() => setShowFilterBanner(false)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        {isSingleChapter ? (
          // Single-chapter mode
          <div className="h-full">
            <RichTextEditor
              editorId={`chapter-${currentChapter.id}`}
              value={currentChapter.content}
              onChange={(html) => handleChapterContentChange(currentChapter.id, html)}
              chapter={currentChapter}
            />
          </div>
        ) : (
          // Multi-chapter / part / full-manuscript mode - Book-style layout
          <div className="max-w-4xl mx-auto py-12 px-8">
            {chapters.map((chapter, index) => (
              <section
                key={chapter.id}
                className="relative"
              >
                {/* Book-style chapter heading */}
                <div className="pt-8 pb-6">
                  <div className="text-center space-y-2">
                    <div className="text-sm uppercase tracking-widest text-gray-400">
                      Chapter {index + 1}
                    </div>
                    <h2 className="text-2xl text-gray-900">
                      {chapter.title || 'Untitled'}
                    </h2>
                  </div>
                </div>

                {/* Chapter content */}
                  <RichTextEditor
                    editorId={`chapter-${chapter.id}`}
                    value={chapter.content}
                    onChange={(html) => handleChapterContentChange(chapter.id, html)}
                    chapter={chapter}
                  />

                {/* Divider between chapters (not on last chapter) */}
                {index < chapters.length - 1 && (
                  <div className="pt-12 pb-4">
                    <div className="border-t border-gray-200" />
                  </div>
                )}
              </section>
            ))}

            {chapters.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No chapters found for this selection.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
