import { Info, Target, BarChart3, MessageSquareMore, Clock3, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { InspectorPayload } from '@/contexts/InspectorContext';
import { useState, useEffect } from 'react';
import { timeAgo } from '@/utils/timeAgo';
import { OutlineMetadataPanel } from '@/components/info-panels/OutlineMetadataPanel';

// Placeholder components for each tool mode
export function InspectorDetails({ payload }: { payload: InspectorPayload | null }) {
  const [outlineMetadataOpen, setOutlineMetadataOpen] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const data = (payload?.data as Record<string, any>) || {};
  
  // Local state for editable fields
  const [chapterTitleLocal, setChapterTitleLocal] = useState('');
  const [partTitleLocal, setPartTitleLocal] = useState('');

  // Sync local state when payload changes
  useEffect(() => {
    if (payload?.type === 'chapter' && data.chapter) {
      setChapterTitleLocal(data.chapter.title);
    }
  }, [payload?.type, data.chapter?.id, data.chapter?.title]);

  useEffect(() => {
    if (payload?.type === 'part' && data.part) {
      setPartTitleLocal(data.part.title);
    }
  }, [payload?.type, data.part?.id, data.part?.title]);

  if (!payload || !payload.data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Info className="w-12 h-12 mb-3" />
        <p className="text-sm">Select an item to view details</p>
      </div>
    );
  }

  // Render chapter details
  if (payload.type === 'chapter' && data.chapter) {
    const chapter = data.chapter;
    const tags = data.tags || [];
    const showOutlineMetadata = data.showOutlineMetadata;
    const updateChapterDetails = data.updateChapterDetails;
    const updateChapterTitle = data.updateChapterTitle;
    const deleteChapter = data.deleteChapter;
    
    const handleTitleChange = (newTitle: string) => {
      setChapterTitleLocal(newTitle);
      if (updateChapterTitle) {
        updateChapterTitle(chapter.id, newTitle);
      }
    };
    
    const handleDelete = () => {
      if (deleteChapter && confirm(`Delete "${chapter.title}"? This action cannot be undone.`)) {
        deleteChapter(chapter.id);
      }
    };
    
    // If we have showOutlineMetadata flag and updateChapterDetails, render the editable panel
    if (showOutlineMetadata && updateChapterDetails) {
      return (
        <div className="space-y-4">
          {/* CHAPTER - EDITABLE TITLE */}
          <div>
            <div className="text-[10px] tracking-wider text-gray-500 mb-1">CHAPTER</div>
            {updateChapterTitle ? (
              <input
                type="text"
                value={chapterTitleLocal}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-sm text-gray-900 mb-1 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Chapter title"
              />
            ) : (
              <div className="text-sm text-gray-900 mb-1">{chapter.title}</div>
            )}
            {chapter.lastEdited && (
              <div className="text-xs text-gray-500">
                Last edited: {timeAgo(chapter.lastEdited)}
              </div>
            )}
          </div>

          {/* WORD COUNT */}
          <div>
            <div className="text-[10px] tracking-wider text-gray-500 mb-1">WORD COUNT</div>
            <div className="text-sm text-gray-900">{chapter.wordCount || 0} words</div>
          </div>

          {/* EDITABLE OUTLINE METADATA */}
          <div>
            <div className="text-[10px] tracking-wider text-gray-500 mb-2">OUTLINE METADATA</div>
            <OutlineMetadataPanel 
              chapter={chapter}
              updateChapterDetails={updateChapterDetails}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* CHAPTER - EDITABLE TITLE */}
        <div>
          <div className="text-[10px] tracking-wider text-gray-500 mb-1">CHAPTER</div>
          {updateChapterTitle ? (
            <input
              type="text"
              value={chapterTitleLocal}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full text-sm text-gray-900 mb-1 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Chapter title"
            />
          ) : (
            <div className="text-sm text-gray-900 mb-1">{chapter.title}</div>
          )}
          {chapter.lastEdited && (
            <div className="text-xs text-gray-500">
              Last edited: {timeAgo(chapter.lastEdited)}
            </div>
          )}
        </div>

        {/* WORD COUNT */}
        <div>
          <div className="text-[10px] tracking-wider text-gray-500 mb-1">WORD COUNT</div>
          <div className="text-sm text-gray-900">{chapter.wordCount || 0} words</div>
          <div className="text-xs text-gray-500">Project total: {/* TODO: calculate total */} words</div>
        </div>

        {/* OUTLINE NOTES */}
        {(chapter.outlinePurpose || chapter.outlineGoal || chapter.outlineConflict || chapter.outlineStakes) && (
          <div>
            <div className="text-[10px] tracking-wider text-gray-500 mb-2">OUTLINE NOTES</div>
            
            {/* Collapsible Outline Metadata */}
            <button
              onClick={() => setOutlineMetadataOpen(!outlineMetadataOpen)}
              className="flex items-center gap-1 text-xs text-gray-500 mb-2 hover:text-gray-700 w-full"
            >
              {outlineMetadataOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              OUTLINE METADATA
            </button>
            
            {outlineMetadataOpen && (
              <div className="space-y-3 mb-4">
                {chapter.outlinePurpose && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Purpose</div>
                    <div className="text-sm text-gray-900">{chapter.outlinePurpose}</div>
                  </div>
                )}
                {chapter.outlineGoal && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Goal</div>
                    <div className="text-sm text-gray-900">{chapter.outlineGoal}</div>
                  </div>
                )}
                {chapter.outlineConflict && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Conflict</div>
                    <div className="text-sm text-gray-900">{chapter.outlineConflict}</div>
                  </div>
                )}
                {chapter.outlineStakes && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Stakes</div>
                    <div className="text-sm text-gray-900">{chapter.outlineStakes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Outline Content */}
            {chapter.outline && (
              <>
                <button
                  onClick={() => setOutlineOpen(!outlineOpen)}
                  className="flex items-center gap-1 text-xs text-gray-500 mb-2 hover:text-gray-700 w-full"
                >
                  {outlineOpen ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  OUTLINE
                </button>
                
                {outlineOpen && (
                  <div 
                    className="text-sm text-gray-900 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: chapter.outline }}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* PROGRESS */}
        <div>
          <div className="text-[10px] tracking-wider text-gray-500 mb-1">PROGRESS</div>
          <div className="text-xs text-gray-500">
            This area can later show chapter targets, completion %, and analytics.
          </div>
        </div>
      </div>
    );
  }

  // Render part details
  if (payload.type === 'part' && data.part) {
    const part = data.part;
    const updatePartName = data.updatePartName;
    const deletePart = data.deletePart;
    
    const handlePartTitleChange = (newTitle: string) => {
      setPartTitleLocal(newTitle);
      if (updatePartName) {
        updatePartName(part.id, newTitle);
      }
    };
    
    const handlePartDelete = () => {
      if (deletePart && confirm(`Delete \"${part.title}\"? Chapters in this part will become unassigned.`)) {
        deletePart(part.id);
      }
    };
    
    return (
      <div className="space-y-4">
        {/* PART - EDITABLE TITLE */}
        <div>
          <div className="text-[10px] tracking-wider text-gray-500 mb-1">PART TITLE</div>
          {updatePartName ? (
            <input
              type="text"
              value={partTitleLocal}
              onChange={(e) => handlePartTitleChange(e.target.value)}
              className="w-full text-sm text-gray-900 mb-1 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Part title"
            />
          ) : (
            <div className="text-sm text-gray-900 mb-1">{part.title}</div>
          )}
        </div>

        {/* PART NOTES */}
        <div>
          <div className="text-[10px] tracking-wider text-gray-500 mb-1">NOTES</div>
          <div className="text-sm text-gray-900">{part.notes || 'No notes'}</div>
        </div>

        {/* SORT ORDER */}
        <div>
          <div className="text-[10px] tracking-wider text-gray-500 mb-1">SORT ORDER</div>
          <div className="text-sm text-gray-900">{part.sortOrder}</div>
        </div>
      </div>
    );
  }

  // Fallback for other types
  return (
    <div className="space-y-4">
      <div className="text-sm">
        <div className="text-gray-500 mb-1">Type</div>
        <div className="text-gray-900">{payload.type || 'Unknown'}</div>
      </div>
      <div className="text-sm">
        <div className="text-gray-500 mb-1">ID</div>
        <div className="text-gray-900 font-mono text-xs">{payload.id || 'N/A'}</div>
      </div>
      <div className="text-sm text-gray-600">
        Inspector details coming soon...
      </div>
    </div>
  );
}

export function GoalsPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <Target className="w-12 h-12 mb-3" />
      <p className="text-sm">Goals panel coming soon...</p>
    </div>
  );
}

export function AnalyticsPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <BarChart3 className="w-12 h-12 mb-3" />
      <p className="text-sm">Analytics panel coming soon...</p>
    </div>
  );
}

export function CommentsPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <MessageSquareMore className="w-12 h-12 mb-3" />
      <p className="text-sm">Comments panel coming soon...</p>
    </div>
  );
}

export function HistoryPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <Clock3 className="w-12 h-12 mb-3" />
      <p className="text-sm">History panel coming soon...</p>
    </div>
  );
}
