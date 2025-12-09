import { APP_VIEWS, getViewDefinition, type AppViewId } from '@/config/views';
import { PaneProvider, type PaneId } from '@/contexts/PaneContext';
import { BreadcrumbBar } from './BreadcrumbBar';
import { Button } from '@/components/ui/button';
import { Filter, Columns, X } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { ContextBar } from './ContextBar';
import { EditorContext } from '@/components/editor/EditorContext';
import { useState } from 'react';
import type { Editor } from '@tiptap/react';

// Breadcrumb data structure for clickable navigation
export interface BreadcrumbData {
  viewLabel: string;
  bookName?: string;
  partName?: string;
  partId?: string;
  chapterName?: string;
  chapterId?: string;
  selectionKind?: 'manuscript' | 'part' | 'chapter'; // NEW: Track what is currently selected
  onSelectManuscript?: () => void;
  onSelectPart?: (partId: string) => void;
  onSelectChapter?: (chapterId: string) => void;
  // NEW: Lists for dropdown navigation
  allParts?: Array<{ id: string; title: string }>;
  allChapters?: Array<{ id: string; title: string; partId?: string | null }>;
}

interface PaneProps {
  paneId: PaneId;
  activeViewId: AppViewId;
  onChangeView: (paneId: PaneId, viewId: AppViewId) => void;
  children: React.ReactNode;
  bookTitle?: string; // NEW: Multi-book support
  hasSecondaryPane?: boolean; // For showing split controls
  onSplitVertical?: () => void;
  onCloseSplit?: () => void;
  selectionLabel?: string; // DEPRECATED: Legacy string format
  breadcrumbData?: BreadcrumbData; // NEW: Structured breadcrumb data
  contextBar?: React.ReactNode; // NEW: UI Cohesion - Context Bar content
  onFiltersClick?: () => void; // NEW: Callback for filters button
}

export function Pane({ 
  paneId, 
  activeViewId, 
  onChangeView, 
  children, 
  bookTitle,
  hasSecondaryPane = false,
  onSplitVertical,
  onCloseSplit,
  selectionLabel,
  breadcrumbData,
  contextBar,
  onFiltersClick
}: PaneProps) {
  const currentView = getViewDefinition(activeViewId);
  const { openOverlay } = useFilters();
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [partDropdownOpen, setPartDropdownOpen] = useState(false);
  const [chapterDropdownOpen, setChapterDropdownOpen] = useState(false);

  // Don't show header on books view
  const isBooksView = activeViewId === 'books';

  return (
    <EditorContext.Provider value={{ activeEditor, setActiveEditor }}>
      <div className="flex-1 flex flex-col bg-white min-w-0 min-h-0">
        {!isBooksView && (
          <>
            {/* Unified Pane Header */}
            <header className="flex items-center justify-between border-b border-gray-200 px-3 py-2 bg-slate-50 flex-shrink-0">
              {/* Left side: Breadcrumbs + View Selector */}
              <div className="flex items-center gap-3">
                {/* Breadcrumbs - NEW: Clickable structured format */}
                <div data-tour-id="breadcrumbs" className="flex items-center gap-1 text-xs text-gray-500">
                  {/* View (Layout) */}
                  <select
                    value={activeViewId}
                    onChange={(e) => onChangeView(paneId, e.target.value as AppViewId)}
                    className="rounded-md border-none bg-transparent px-1 py-0 text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {APP_VIEWS.filter(v => v.id !== 'books').map((view) => (
                      <option key={view.id} value={view.id}>
                        {view.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Book Name */}
                  {breadcrumbData?.bookName && (
                    <>
                      <span className="mx-1">›</span>
                      {breadcrumbData.onSelectManuscript ? (
                        <button
                          onClick={breadcrumbData.onSelectManuscript}
                          className={`hover:text-gray-900 hover:underline cursor-pointer max-w-[160px] truncate ${
                            breadcrumbData.selectionKind === 'manuscript' 
                              ? 'bg-blue-100 text-blue-900 px-2 py-0.5 rounded' 
                              : 'text-gray-700'
                          }`}
                          title={breadcrumbData.bookName}
                        >
                          {breadcrumbData.bookName}
                        </button>
                      ) : (
                        <span className="text-gray-700 max-w-[160px] truncate" title={breadcrumbData.bookName}>{breadcrumbData.bookName}</span>
                      )}
                    </>
                  )}
                  
                  {/* Part Name */}
                  {breadcrumbData?.allParts && breadcrumbData.allParts.length > 0 && (
                    <>
                      <span className="mx-1">›</span>
                      <select
                        value={partDropdownOpen ? '' : (breadcrumbData.partId || '')}
                        onFocus={() => {
                          // When dropdown opens, temporarily clear value so onChange will fire for any selection
                          setPartDropdownOpen(true);
                        }}
                        onBlur={() => {
                          // If they clicked away without selecting, restore the dropdown
                          setPartDropdownOpen(false);
                        }}
                        onChange={(e) => {
                          const selectedPartId = e.target.value;
                          if (selectedPartId && breadcrumbData.onSelectPart) {
                            breadcrumbData.onSelectPart(selectedPartId);
                          }
                          setPartDropdownOpen(false);
                        }}
                        className={`rounded-md border-none text-xs hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate ${
                          breadcrumbData.selectionKind === 'part' 
                            ? 'bg-blue-100 text-blue-900 px-2 py-0.5' 
                            : 'bg-transparent px-1 py-0 text-gray-700'
                        }`}
                        title={breadcrumbData.partName}
                      >
                        {(!breadcrumbData.partId || partDropdownOpen) && (
                          <option value="">{partDropdownOpen ? 'Select part...' : '(part)'}</option>
                        )}
                        {breadcrumbData.allParts.map((part) => (
                          <option key={part.id} value={part.id}>
                            {part.title}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  
                  {/* Chapter Name */}
                  {breadcrumbData?.allChapters && breadcrumbData.allChapters.length > 0 && (
                    <>
                      <span className="mx-1">›</span>
                      <select
                        value={breadcrumbData.chapterId || ''}
                        onChange={(e) => {
                          const selectedChapterId = e.target.value;
                          if (selectedChapterId && breadcrumbData.onSelectChapter) {
                            breadcrumbData.onSelectChapter(selectedChapterId);
                          }
                        }}
                        className={`rounded-md border-none text-xs hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate ${
                          breadcrumbData.selectionKind === 'chapter' 
                            ? 'bg-blue-100 text-blue-900 px-2 py-0.5' 
                            : 'bg-transparent px-1 py-0 text-gray-700'
                        }`}
                        title={breadcrumbData.chapterName}
                      >
                        {!breadcrumbData.chapterId && (
                          <option value="">(chapter)</option>
                        )}
                        {breadcrumbData.allChapters.map((chapter) => (
                          <option key={chapter.id} value={chapter.id}>
                            {chapter.title}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  
                  {/* Legacy fallback */}
                  {!breadcrumbData && selectionLabel && (
                    <>
                      <span className="mx-1">›</span>
                      <span className="text-gray-700">{selectionLabel}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right side: Filters + Split Controls */}
              <div className="flex items-center gap-2">
                {/* Filters button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFiltersClick || openOverlay}
                  className="flex items-center gap-1 h-7 text-xs"
                >
                  <Filter className="w-3 h-3" />
                  Filters
                </Button>

                {/* Split controls - Open button in primary, Close button in secondary */}
                {paneId === 'primary' && !hasSecondaryPane && (
                  <button
                    onClick={onSplitVertical}
                    className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    aria-label="Open Dual Pane"
                    title="Open Dual Pane"
                  >
                    <Columns className="w-4 h-4" />
                  </button>
                )}
                
                {paneId === 'secondary' && hasSecondaryPane && (
                  <button
                    onClick={onCloseSplit}
                    className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    aria-label="Close Dual Pane"
                    title="Close Dual Pane"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </header>
            
            {/* Context Bar - View-specific controls */}
            {contextBar && (
              <ContextBar>
                {contextBar}
              </ContextBar>
            )}
          </>
        )}

        {/* Content wrapped in PaneProvider */}
        <PaneProvider paneId={paneId}>
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </PaneProvider>
      </div>
    </EditorContext.Provider>
  );
}
