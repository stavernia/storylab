import { useState, useEffect } from 'react';
import { EditorToolbar } from './editor/EditorToolbar';
import { TiptapChapterEditor } from './editor/TiptapChapterEditor';
import { ChapterSection } from './editor/ChapterSection';
import { X, Info } from 'lucide-react';
import type { Chapter, Part, ManuscriptSelection } from '@/App';
import { useTagFilter } from '@/contexts/TagFilterContext';
import { useEntityTags } from '@/hooks/useEntityTags';
import { useChapterNumbering } from '@/contexts/ChapterNumberingContext';
import { toast } from 'sonner';

type EditorViewProps = {
  chapters: Chapter[];  // Pre-filtered chapters from BinderWrapper
  selection: ManuscriptSelection; // Add selection prop
  currentChapterId: string;
  setCurrentChapterId: (id: string) => void;
  updateChapter: (id: string, content: string) => void;
  addChapter: (title?: string) => Promise<string>;
  deleteChapter: (id: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterDetails: (id: string, updates: Partial<Chapter>) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  parts?: Part[];
  onChapterInfoClick?: (chapter: Chapter) => void;
  onPartInfoClick?: (part: Part) => void;
};

export function EditorView({
  chapters,
  selection, // Add selection
  currentChapterId,
  setCurrentChapterId,
  updateChapter,
  addChapter,
  deleteChapter,
  updateChapterTitle,
  updateChapterDetails,
  reorderChapters,
  parts,
  onChapterInfoClick,
  onPartInfoClick,
}: EditorViewProps) {
  const [showFilterBanner, setShowFilterBanner] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Tag filtering for current chapter
  const { matches, isActive } = useTagFilter();
  const { getChapterNumber, getPartNumber } = useChapterNumbering();

  // Determine display mode based on selection kind, not chapter count
  // 'chapter' selection = single mode
  // 'part' or 'manuscript' selection = multi mode (even if only 1 chapter)
  const mode = selection.kind === 'chapter' ? 'single' : 'multi';
  const visibleChapters = chapters; // All chapters passed in are already filtered by BinderWrapper
  const currentChapter = mode === 'single' ? chapters[0] : null;
  const { tags: currentTags } = useEntityTags('chapter', currentChapter?.id || '');

  // Check if current chapter is hidden by filters
  const currentHidden = isActive && currentTags && !matches(currentTags);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handler for individual chapter changes
  const handleChapterContentChange = (chapterId: string, html: string) => {
    updateChapter(chapterId, html);
  };

  if (visibleChapters.length === 0) {
    // In multi-chapter mode (part or manuscript), show part headers even if no chapters
    if (mode !== 'single') {
      // Determine which parts to show based on selection
      let partsToShow: Part[] = [];
      
      if (selection.kind === 'manuscript') {
        // Show all parts for manuscript view
        partsToShow = parts ? [...parts].sort((a, b) => a.sortOrder - b.sortOrder) : [];
        console.log('EditorView manuscript empty state - parts:', parts, 'partsToShow:', partsToShow);
      } else if (selection.kind === 'part' && selection.partId) {
        // Show only the selected part
        const selectedPart = parts?.find(p => p.id === selection.partId);
        if (selectedPart) {
          partsToShow = [selectedPart];
        }
        console.log('EditorView part empty state - selected part:', selectedPart);
      }
      
      return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
          <EditorToolbar />
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto py-12 px-8">
              {/* Show part headers */}
              {partsToShow.map((part, index) => (
                <div key={part.id}>
                  <div className="text-center mb-12 mt-16 first:mt-0">
                    <div className="inline-block">
                      <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                        PART {getPartNumber(part.id)}
                      </div>
                      <h2 className="text-3xl font-normal text-gray-900 mb-1">
                        {part.title}
                      </h2>
                      {part.notes && (
                        <p className="text-sm text-gray-500 italic mt-2 max-w-xl">
                          {part.notes}
                        </p>
                      )}
                      <div className="h-px bg-gray-200 mt-8 w-24 mx-auto" />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Empty state message */}
              <div className="text-center mt-16">
                <p className="text-gray-400">No chapters to display</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Single chapter mode - just show empty state
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No chapters to display</p>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-gray-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Filter Warning Banner */}
      {currentHidden && showFilterBanner && mode === 'single' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-yellow-800">
            This chapter is hidden by tag filters. Clear filters to edit.
          </p>
          <button
            onClick={() => setShowFilterBanner(false)}
            className="text-yellow-600 hover:text-yellow-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Toolbar - shared toolbar for both single and multi-chapter modes */}
      <EditorToolbar />

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto py-12 px-8">
          {/* Single Chapter Mode */}
          {mode === 'single' && currentChapter && (
            <>
              {/* Chapter Header (non-editable) */}
              <div className="group text-center mb-10 relative">
                <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">
                  CHAPTER {getChapterNumber(currentChapter.id)}
                </div>
                <h2 className="text-2xl font-normal text-gray-900">
                  {currentChapter.title || 'Untitled'}
                </h2>
                {onChapterInfoClick && (
                  <button
                    onClick={() => onChapterInfoClick(currentChapter)}
                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"
                    title="Chapter info"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Editable content using TiptapChapterEditor */}
              <TiptapChapterEditor
                chapterId={currentChapter.id}
                value={currentChapter.content || ''}
                onChange={(html) => handleChapterContentChange(currentChapter.id, html)}
                readOnly={false}
              />
              
              {/* Chapter divider */}
              <div className="h-px bg-gray-200 mt-12 w-24 mx-auto" />
            </>
          )}

          {/* Multi-Chapter Mode - Stacked Editors */}
          {mode !== 'single' && (() => {
            // For manuscript view, show all parts with their chapters (or empty state)
            if (selection.kind === 'manuscript' && parts && parts.length > 0) {
              const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);
              
              return sortedParts.map((part) => {
                const partChapters = visibleChapters.filter(ch => ch.partId === part.id);
                
                return (
                  <div key={part.id}>
                    {/* Part Header */}
                    <div className="group text-center mb-12 mt-16 first:mt-0">
                      <div className="relative max-w-3xl mx-auto">
                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                          PART {getPartNumber(part.id)}
                        </div>
                        <h2 className="text-3xl font-normal text-gray-900 mb-1">
                          {part.title}
                        </h2>
                        {part.notes && (
                          <p className="text-sm text-gray-500 italic mt-2 max-w-xl mx-auto">
                            {part.notes}
                          </p>
                        )}
                        <div className="h-px bg-gray-200 mt-8 w-24 mx-auto" />
                        {onPartInfoClick && (
                          <button
                            onClick={() => onPartInfoClick(part)}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"
                            title="Part info"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Chapters in this part */}
                    {partChapters.length > 0 ? (
                      partChapters.map((chapter) => (
                        <section key={chapter.id} className="mb-16">
                          {/* Read-only chapter header */}
                          <div className="group text-center mb-10">
                            <div className="relative max-w-3xl mx-auto">
                              <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">
                                CHAPTER {getChapterNumber(chapter.id)}
                              </div>
                              <h2 className="text-2xl font-normal text-gray-900">
                                {chapter.title || 'Untitled'}
                              </h2>
                              {onChapterInfoClick && (
                                <button
                                  onClick={() => onChapterInfoClick(chapter)}
                                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"
                                  title="Chapter info"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Editable chapter content */}
                          <TiptapChapterEditor
                            chapterId={chapter.id}
                            value={chapter.content || ''}
                            onChange={(html) => handleChapterContentChange(chapter.id, html)}
                            readOnly={false}
                          />
                          
                          {/* Chapter divider */}
                          <div className="h-px bg-gray-200 mt-12 w-24 mx-auto" />
                        </section>
                      ))
                    ) : (
                      <div className="text-center mb-16">
                        <p className="text-gray-400">No chapters to display</p>
                      </div>
                    )}
                  </div>
                );
              });
            }
            
            // For part view or chapters without parts, use the old logic
            return visibleChapters.map((chapter, index) => {
              // Check if this is the first chapter of a new part
              const isFirstChapterOfPart = index === 0 
                ? !!chapter.partId
                : (chapter.partId && chapter.partId !== visibleChapters[index - 1]?.partId);
              const currentPart = parts?.find(p => p.id === chapter.partId);
              
              return (
                <div key={chapter.id}>
                  {/* Part Header - only show when a new part starts */}
                  {isFirstChapterOfPart && currentPart && (
                    <div className="group text-center mb-12 mt-16 first:mt-0">
                      <div className="relative max-w-3xl mx-auto">
                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                          PART {getPartNumber(currentPart.id)}
                        </div>
                        <h2 className="text-3xl font-normal text-gray-900 mb-1">
                          {currentPart.title}
                        </h2>
                        {currentPart.notes && (
                          <p className="text-sm text-gray-500 italic mt-2 max-w-xl mx-auto">
                            {currentPart.notes}
                          </p>
                        )}
                        <div className="h-px bg-gray-200 mt-8 w-24 mx-auto" />
                        {onPartInfoClick && (
                          <button
                            onClick={() => onPartInfoClick(currentPart)}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"
                            title="Part info"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Chapter Section */}
                  <section className="mb-16">
                    {/* Read-only chapter header */}
                    <div className="group text-center mb-10 relative">
                      <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">
                        CHAPTER {getChapterNumber(chapter.id)}
                      </div>
                      <h2 className="text-2xl font-normal text-gray-900">
                        {chapter.title || 'Untitled'}
                      </h2>
                      {onChapterInfoClick && (
                        <button
                          onClick={() => onChapterInfoClick(chapter)}
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"
                          title="Chapter info"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Editable chapter content */}
                    <TiptapChapterEditor
                      chapterId={chapter.id}
                      value={chapter.content || ''}
                      onChange={(html) => handleChapterContentChange(chapter.id, html)}
                      readOnly={false}
                    />
                    
                    {/* Chapter divider */}
                    <div className="h-px bg-gray-200 mt-12 w-24 mx-auto" />
                  </section>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
