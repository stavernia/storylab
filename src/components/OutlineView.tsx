import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import type { Chapter, Part, ManuscriptSelection } from '@/App';
import { TiptapChapterEditor } from './editor/TiptapChapterEditor';
import { EditorToolbar } from './editor/EditorToolbar';
import { useChapterNumbering } from '@/contexts/ChapterNumberingContext';
import { useDebounce } from '@/hooks/useDebounce';

type OutlineViewProps = {
  chapters: Chapter[]; // Pre-filtered chapters from BinderWrapper
  selection: ManuscriptSelection; // Add selection prop
  currentChapterId: string;
  setCurrentChapterId: (id: string) => void;
  addChapter: (title?: string) => Promise<string>;
  deleteChapter: (id: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapter: (id: string, content: string) => void;
  parts?: Part[];
  onChapterInfoClick?: (chapter: Chapter) => void;
  onPartInfoClick?: (part: Part) => void;
};

export function OutlineView({
  chapters,
  selection, // Add selection
  currentChapterId,
  setCurrentChapterId,
  addChapter,
  deleteChapter,
  updateChapterTitle,
  updateChapter,
  parts,
  onChapterInfoClick,
  onPartInfoClick,
}: OutlineViewProps) {
  const [isClient, setIsClient] = useState(false);
  const { getChapterNumber, getPartNumber } = useChapterNumbering();

  // Determine display mode based on selection kind, not chapter count
  // 'chapter' selection = single mode
  // 'part' or 'manuscript' selection = multi mode (even if only 1 chapter)
  const mode = selection.kind === 'chapter' ? 'single' : 'multi';
  const visibleChapters = chapters; // All chapters passed in are already filtered by BinderWrapper
  const currentChapter = mode === 'single' ? chapters[0] : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-save with debounce
  const debouncedUpdateChapter = useDebounce(
    (id: string, content: string) => {
      updateChapter(id, content);
    },
    500
  );

  const handleOutlineChange = (chapterId: string, html: string) => {
    debouncedUpdateChapter(chapterId, html);
  };

  if (chapters.length === 0) {
    // In multi-chapter mode (part or manuscript), show part headers even if no chapters
    if (mode !== 'single') {
      // Determine which parts to show based on selection
      let partsToShow: Part[] = [];
      
      if (selection.kind === 'manuscript') {
        // Show all parts for manuscript view
        partsToShow = parts ? [...parts].sort((a, b) => a.sortOrder - b.sortOrder) : [];
        console.log('OutlineView manuscript empty state - parts:', parts, 'partsToShow:', partsToShow);
      } else if (selection.kind === 'part' && selection.partId) {
        // Show only the selected part
        const selectedPart = parts?.find(p => p.id === selection.partId);
        if (selectedPart) {
          partsToShow = [selectedPart];
        }
        console.log('OutlineView part empty state - selected part:', selectedPart);
      }
      
      return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
          <EditorToolbar />
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto py-12 px-8">
              {/* Show part headers */}
              {partsToShow.map((part, index) => (
                <div key={part.id}>
                  <div className="mb-12 mt-16 first:mt-0">
                    <div>
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
                      <div className="h-px bg-gray-200 mt-8 w-24" />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Empty state message */}
              <div className="mt-16">
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
      {/* Editor Toolbar - shared toolbar for both single and multi-chapter modes */}
      <EditorToolbar />

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto py-12 px-8">
          {/* Single Chapter Mode */}
          {mode === 'single' && currentChapter && (
            <>
              {/* Chapter Header (non-editable) - LEFT ALIGNED */}
              <div className="group mb-10 relative">
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
              
              {/* Editable outline content using TiptapChapterEditor */}
              <TiptapChapterEditor
                chapterId={currentChapter.id}
                value={currentChapter.outline || ''}
                onChange={(html) => handleOutlineChange(currentChapter.id, html)}
                readOnly={false}
              />
              
              {/* Chapter divider */}
              <div className="h-px bg-gray-200 mt-12 w-24" />
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
                    {/* Part Header - LEFT ALIGNED */}
                    <div className="group mb-12 mt-16 first:mt-0">
                      <div className="relative max-w-3xl">
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
                        <div className="h-px bg-gray-200 mt-8 w-24" />
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
                          {/* Read-only chapter header - LEFT ALIGNED */}
                          <div className="group mb-10">
                            <div className="relative max-w-3xl">
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

                          {/* Editable chapter outline content */}
                          <TiptapChapterEditor
                            chapterId={chapter.id}
                            value={chapter.outline || ''}
                            onChange={(html) => handleOutlineChange(chapter.id, html)}
                            readOnly={false}
                          />
                          
                          {/* Chapter divider */}
                          <div className="h-px bg-gray-200 mt-12 w-24" />
                        </section>
                      ))
                    ) : (
                      <div className="mb-16">
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
                  {/* Part Header - only show when a new part starts - LEFT ALIGNED */}
                  {isFirstChapterOfPart && currentPart && (
                    <div className="group mb-12 mt-16 first:mt-0 relative">
                      <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                        PART {getPartNumber(currentPart.id)}
                      </div>
                      <h2 className="text-3xl font-normal text-gray-900 mb-1">
                        {currentPart.title}
                      </h2>
                      {currentPart.notes && (
                        <p className="text-sm text-gray-500 italic mt-2 max-w-xl">
                          {currentPart.notes}
                        </p>
                      )}
                      <div className="h-px bg-gray-200 mt-8 w-24" />
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
                  )}
                  
                  {/* Chapter Section */}
                  <section className="mb-16">
                    {/* Read-only chapter header - LEFT ALIGNED */}
                    <div className="group mb-10 relative">
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

                    {/* Editable chapter outline content */}
                    <TiptapChapterEditor
                      chapterId={chapter.id}
                      value={chapter.outline || ''}
                      onChange={(html) => handleOutlineChange(chapter.id, html)}
                      readOnly={false}
                    />
                    
                    {/* Chapter divider */}
                    <div className="h-px bg-gray-200 mt-12 w-24" />
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
