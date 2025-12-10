import { useState, useEffect, useRef, useMemo } from "react";
import { ChapterList } from '@/components/ChapterList';
import { ResizableSidebar } from './ResizableSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Chapter, Part, ManuscriptSelection } from '@/App';
import type { BreadcrumbData } from "@/components/layout/Pane";

interface BinderWrapperProps {
  // Data
  chapters: Chapter[];
  parts?: Part[];
  bookTitle?: string;
  
  // Selection state
  selection: ManuscriptSelection;
  onSelectionChange: (selection: ManuscriptSelection) => void;
  
  // Chapter operations
  currentChapterId?: string;
  setCurrentChapterId?: (id: string) => void;
  addChapter: (title?: string) => Promise<string>;
  deleteChapter: (id: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterDetails?: (id: string, updates: Partial<Chapter>) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  
  // Part operations
  addPart?: (data: { title: string; notes?: string }) => Promise<Part>;
  deletePart?: (id: string) => void;
  updatePartName?: (id: string, name: string) => void;
  reorderParts?: (parts: Part[]) => void;
  
  // UI state
  leftSidebarOpen: boolean;
  setLeftSidebarOpen?: (open: boolean) => void;
  
  // Breadcrumb callback
  setBreadcrumbData?: (data: BreadcrumbData) => void;
  
  // Inspector callback
  onChapterInfoClick?: (chapter: Chapter) => void;
  onManuscriptInfoClick?: () => void;
  onPartInfoClick?: (part: Part) => void;
  
  // Children (the actual view content)
  children: (filteredChapters: Chapter[]) => React.ReactNode;
}

export function BinderWrapper({
  chapters,
  parts,
  bookTitle,
  selection,
  onSelectionChange,
  currentChapterId,
  setCurrentChapterId,
  addChapter,
  deleteChapter,
  updateChapterTitle,
  updateChapterDetails,
  reorderChapters,
  addPart,
  deletePart,
  updatePartName,
  reorderParts,
  leftSidebarOpen,
  setLeftSidebarOpen,
  setBreadcrumbData,
  onChapterInfoClick,
  onManuscriptInfoClick,
  onPartInfoClick,
  children,
}: BinderWrapperProps) {
  // Track binder position for fixed positioning of open tab
  const binderRef = useRef<HTMLDivElement>(null);
  const [binderRightEdge, setBinderRightEdge] = useState(0);
  
  // Update binder right edge position when it changes
  useEffect(() => {
    const updateBinderPosition = () => {
      if (binderRef.current && leftSidebarOpen) {
        const rect = binderRef.current.getBoundingClientRect();
        setBinderRightEdge(rect.right);
      }
    };
    
    updateBinderPosition();
    window.addEventListener('resize', updateBinderPosition);
    
    // Use ResizeObserver to detect binder width changes
    const resizeObserver = new ResizeObserver(updateBinderPosition);
    if (binderRef.current) {
      resizeObserver.observe(binderRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateBinderPosition);
      resizeObserver.disconnect();
    };
  }, [leftSidebarOpen]);

  // Sort chapters by sortOrder
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }, [chapters]);

  const sortedParts = useMemo(() => {
    return parts
      ? [...parts].sort((a, b) => {
          const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        })
      : [];
  }, [parts]);

  // Filter chapters based on selection
  let visibleChapters: Chapter[] = [];
  if (selection.kind === 'manuscript') {
    visibleChapters = sortedChapters;
  } else if (selection.kind === 'part') {
    visibleChapters = sortedChapters.filter((ch) => ch.partId === selection.partId);
  } else {
    const chapter = sortedChapters.find((ch) => ch.id === selection.chapterId) ?? sortedChapters[0];
    visibleChapters = chapter ? [chapter] : [];
  }

  // Handlers for selection changes from binder
  const handleSelectManuscript = () => {
    onSelectionChange({ kind: 'manuscript' });
  };

  const handleSelectPart = (partId: string) => {
    onSelectionChange({ kind: 'part', partId });
  };

  const handleSelectChapter = (chapterId: string) => {
    onSelectionChange({ kind: 'chapter', chapterId });
    if (setCurrentChapterId) {
      setCurrentChapterId(chapterId);
    }
  };

  // Handlers for chapter list
  const handleReorderChapters = (orderedIds: string[]) => {
    const idToChapter = new Map(chapters.map(ch => [ch.id, ch]));
    const reordered = orderedIds
      .map(id => idToChapter.get(id))
      .filter((ch): ch is Chapter => !!ch);
    reorderChapters(reordered);
  };

  const handleReorder = (reorderedChapters: Chapter[]) => {
    reorderChapters(reorderedChapters);
  };

  // Generate breadcrumb data
  const lastBreadcrumbSig = useRef<string>("");

  useEffect(() => {
    if (!setBreadcrumbData) return;

    const chapter =
      selection.kind === "chapter"
        ? sortedChapters.find((ch) => ch.id === selection.chapterId)
        : null;
    const part =
      selection.kind === "part"
        ? parts?.find((p) => p.id === selection.partId)
        : chapter && chapter.partId
          ? parts?.find((p) => p.id === chapter.partId)
          : null;

    const allParts = sortedParts.map((p) => ({ id: p.id, title: p.title }));
    const allChapters = sortedChapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      partId: ch.partId,
    }));

    const payload: BreadcrumbData = {
      viewLabel: "View",
      bookName: bookTitle,
      partName: part?.title,
      partId: part?.id,
      chapterName: chapter?.title,
      chapterId: chapter?.id,
      selectionKind: selection.kind,
      onSelectManuscript: handleSelectManuscript,
      onSelectPart: handleSelectPart,
      onSelectChapter: handleSelectChapter,
      allParts,
      allChapters,
    };

    const signature = JSON.stringify({
      bookName: payload.bookName,
      partId: payload.partId,
      chapterId: payload.chapterId,
      selectionKind: payload.selectionKind,
      partsLen: allParts.length,
      chaptersLen: allChapters.length,
    });

    if (signature !== lastBreadcrumbSig.current) {
      lastBreadcrumbSig.current = signature;
      setBreadcrumbData(payload);
    }
  }, [selection, sortedChapters, sortedParts, bookTitle, setBreadcrumbData, handleSelectChapter, handleSelectManuscript, handleSelectPart]);

  return (
    <div data-tour-id="workspace" className="h-full flex min-h-0 relative overflow-hidden">
      {/* Left Sidebar - Chapter List (Collapsible Binder) - with SideTab when open */}
      <div ref={binderRef} className="relative flex-shrink-0">
        <ResizableSidebar
          isOpen={leftSidebarOpen}
          storageKey="chapter-sidebar-width"
          defaultWidth={240}
          minWidth={200}
          maxWidth={400}
        >
          <ChapterList
            chapters={chapters}
            currentChapterId={currentChapterId || ''}
            setCurrentChapterId={handleSelectChapter}
            addChapter={addChapter}
            deleteChapter={deleteChapter}
            updateChapterTitle={updateChapterTitle}
            updateChapterDetails={updateChapterDetails}
            onChapterInfoClick={onChapterInfoClick}
            onManuscriptInfoClick={onManuscriptInfoClick}
            onReorderChapters={handleReorderChapters}
            onReorder={handleReorder}
            parts={parts}
            addPart={addPart}
            deletePart={deletePart}
            updatePartName={updatePartName}
            reorderParts={reorderParts}
            onSelectManuscript={handleSelectManuscript}
            onSelectPart={handleSelectPart}
            selection={selection}
            onPartInfoClick={onPartInfoClick}
          />
        </ResizableSidebar>
        
        {/* Binder SideTab (CLOSED state) - open the binder */}
        {!leftSidebarOpen && setLeftSidebarOpen && (
          <button
            type="button"
            onClick={() => setLeftSidebarOpen(true)}
            className="fixed left-16 top-[50vh] -translate-y-1/2 w-5 h-16 rounded-r-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow z-20"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </button>
        )}
        
        {/* Binder SideTab (OPEN state) - fixed positioning to match v219 */}
        {leftSidebarOpen && setLeftSidebarOpen && binderRightEdge > 0 && (
          <button
            type="button"
            onClick={() => setLeftSidebarOpen(false)}
            style={{ left: `${binderRightEdge}px` }}
            className="fixed top-[50vh] -translate-y-1/2 w-5 h-16 rounded-r-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow z-20"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {children(visibleChapters)}
      </div>
    </div>
  );
}
