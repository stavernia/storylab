import type React from 'react';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Info, GripVertical, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import type { Chapter, Part } from '@/App';
import { TagBadges } from './tags/TagBadges';
import { useTagFilter, type FilterMode } from '@/contexts/TagFilterContext';
import { useEntityTags } from '@/hooks/useEntityTags';
import { useChapterNumbering } from '@/contexts/ChapterNumberingContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { Tag } from '@/services/tag';

// NEW: Multi-Chapter View - Selection type
type ManuscriptSelection =
  | { kind: 'manuscript' }
  | { kind: 'part'; partId: string }
  | { kind: 'chapter'; chapterId: string };

type ChapterListProps = {
  chapters: Chapter[];
  currentChapterId: string;
  setCurrentChapterId: (id: string) => void;
  addChapter: (title?: string) => Promise<string>;
  deleteChapter: (id: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterDetails?: (id: string, updates: Partial<Chapter>) => void;
  onChapterInfoClick?: (chapter: Chapter) => void;
  onReorder?: (chapters: Chapter[]) => void;
  onReorderChapters?: (orderedIds: string[]) => void;
  parts?: Part[];
  addPart?: (data: { title: string; notes?: string }) => Promise<Part>;
  deletePart?: (id: string) => void;
  updatePartName?: (id: string, name: string) => void;
  reorderParts?: (parts: Part[]) => void;
  onSelectManuscript?: () => void; // NEW: Multi-Chapter View
  onSelectPart?: (partId: string) => void; // NEW: Multi-Chapter View
  selection?: ManuscriptSelection; // NEW: Multi-Chapter View
  onManuscriptInfoClick?: () => void; // NEW: Project info for full manuscript
  onPartInfoClick?: (part: Part) => void; // NEW: Part info
};

type DragPosition = 'before' | 'after' | null;

type PartHeaderProps = {
  part: Part;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (value: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  startEditing: (id: string, title: string) => void;
  deletePart?: (id: string) => void;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDragEnd: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  isDragging: boolean;
  isDragOver: boolean;
  dragPosition: DragPosition;
  onSelectPart?: (partId: string) => void;
  selection?: ManuscriptSelection;
  onPartInfoClick?: (part: Part) => void;
};

type ChapterRowProps = {
  chapter: Chapter;
  index: number;
  chapters: Chapter[];
  currentChapterId: string;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (value: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  setCurrentChapterId: (id: string) => void;
  startEditing: (id: string, title: string) => void;
  deleteChapter?: (id: string) => void;
  onChapterInfoClick?: (chapter: Chapter) => void;
  matches: (tags: Tag[]) => boolean;
  isActive: boolean;
  mode: FilterMode;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDragEnd: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  isDragging: boolean;
  isDragOver: boolean;
  dragPosition: DragPosition;
  inPart: boolean;
  selection?: ManuscriptSelection;
};

export function ChapterList({
  chapters,
  currentChapterId,
  setCurrentChapterId,
  addChapter,
  deleteChapter,
  updateChapterTitle,
  updateChapterDetails,
  onChapterInfoClick,
  onReorder,
  onReorderChapters,
  parts,
  addPart,
  deletePart,
  updatePartName,
  reorderParts,
  onSelectManuscript,
  onSelectPart,
  selection,
  onManuscriptInfoClick,
  onPartInfoClick
}: ChapterListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addingType, setAddingType] = useState<'chapter' | 'part' | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [collapsedParts, setCollapsedParts] = useState<Set<string>>(new Set());

  // Drag-and-drop state
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: 'chapter' | 'part' } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ id: string; type: 'chapter' | 'part'; position: 'before' | 'after' } | null>(null);

  // Tag filtering
  const { matches, isActive, mode } = useTagFilter();

  // Create ordered list of items (parts and chapters in correct order)
  const orderedItems: Array<{ type: 'part'; data: Part } | { type: 'chapter'; data: Chapter }> = [];
  
  if (parts && parts.length > 0) {
    const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);
    
    sortedParts.forEach(part => {
      // Add the part itself
      orderedItems.push({ type: 'part', data: part });
      
      // Add chapters in this part (maintain their original order)
      const partChapters = chapters.filter(ch => ch.partId === part.id);
      partChapters.forEach(chapter => {
        orderedItems.push({ type: 'chapter', data: chapter });
      });
    });
    
    // Add unassigned chapters at the end
    const unassignedChapters = chapters.filter(ch => !ch.partId);
    unassignedChapters.forEach(chapter => {
      orderedItems.push({ type: 'chapter', data: chapter });
    });
  } else {
    // No parts, just show all chapters
    chapters.forEach(chapter => {
      orderedItems.push({ type: 'chapter', data: chapter });
    });
  }

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      const chapter = chapters.find(ch => ch.id === editingId);
      const part = parts?.find(p => p.id === editingId);
      
      if (chapter) {
        updateChapterTitle(editingId, editTitle.trim());
      } else if (part && updatePartName) {
        updatePartName(editingId, editTitle.trim());
      }
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const startAdding = (type: 'chapter' | 'part') => {
    setIsAdding(true);
    setAddingType(type);
    setNewTitle('');
  };

  const saveNew = async () => {
    if (newTitle.trim()) {
      if (addingType === 'chapter') {
        addChapter(newTitle.trim());
      } else if (addingType === 'part' && addPart) {
        await addPart({ title: newTitle.trim() });
      }
    }
    setIsAdding(false);
    setAddingType(null);
    setNewTitle('');
  };

  const cancelNew = () => {
    setIsAdding(false);
    setAddingType(null);
    setNewTitle('');
  };

  const togglePartCollapse = (partId: string) => {
    const newCollapsed = new Set(collapsedParts);
    if (newCollapsed.has(partId)) {
      newCollapsed.delete(partId);
    } else {
      newCollapsed.add(partId);
    }
    setCollapsedParts(newCollapsed);
  };

  const handleDragStart = (id: string, type: 'chapter' | 'part') => {
    setDraggingItem({ id, type });
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string, type: 'chapter' | 'part') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggingItem) return;
    
    // Determine position based on mouse Y position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';
    
    setDragOverItem({ id, type, position });
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetType: 'chapter' | 'part') => {
    e.preventDefault();
    
    if (!draggingItem || !dragOverItem) return;
    if (draggingItem.id === targetId) {
      handleDragEnd();
      return;
    }

    const { id: draggedId, type: draggedType } = draggingItem;
    const { position } = dragOverItem;

    // Handle part reordering
    if (draggedType === 'part' && targetType === 'part' && reorderParts && parts) {
      const sourceIndex = parts.findIndex(p => p.id === draggedId);
      const targetIndex = parts.findIndex(p => p.id === targetId);
      
      if (sourceIndex === -1 || targetIndex === -1) return;
      
      const newParts = [...parts];
      const [moved] = newParts.splice(sourceIndex, 1);
      
      // Adjust target index if inserting after
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      const adjustedIndex = sourceIndex < targetIndex ? insertIndex - 1 : insertIndex;
      
      newParts.splice(adjustedIndex, 0, moved);
      
      // Update sortOrder
      const withOrder = newParts.map((p, i) => ({ ...p, sortOrder: i }));
      reorderParts(withOrder);
    }
    
    // Handle chapter reordering and part assignment
    else if (draggedType === 'chapter' && updateChapterDetails && (onReorderChapters || onReorder)) {
      const draggedChapter = chapters.find(ch => ch.id === draggedId);
      if (!draggedChapter) return;

      // Determine target part and position
      let targetPartId: string | null = null;
      let targetChapterId: string | null = null;
      
      if (targetType === 'part') {
        // Dropping on a part header - assign to that part at the beginning
        targetPartId = targetId;
      } else if (targetType === 'chapter') {
        // Dropping on a chapter - use that chapter's part and position
        const targetChapter = chapters.find(ch => ch.id === targetId);
        targetPartId = targetChapter?.partId || null;
        targetChapterId = targetId;
      }

      // Get all chapters for the target part
      const targetPartChapters = chapters.filter(ch => 
        (targetPartId ? ch.partId === targetPartId : !ch.partId)
      );

      // Create new order within target part
      let newOrder: string[];
      
      if (targetChapterId) {
        // Dropping relative to another chapter
        const targetPartIds = targetPartChapters.map(ch => ch.id).filter(id => id !== draggedId);
        const targetIndex = targetPartIds.indexOf(targetChapterId);
        
        if (targetIndex !== -1) {
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
          targetPartIds.splice(insertIndex, 0, draggedId);
          newOrder = targetPartIds;
        } else {
          newOrder = [...targetPartIds, draggedId];
        }
      } else {
        // Dropping on a part header - put at beginning
        const targetPartIds = targetPartChapters.map(ch => ch.id).filter(id => id !== draggedId);
        newOrder = [draggedId, ...targetPartIds];
      }

      // Build complete reordered chapter list with updated partId
      const updatedChapters = chapters.map(ch => {
        if (ch.id === draggedId) {
          // Update the dragged chapter's partId
          return { ...ch, partId: targetPartId || undefined };
        }
        return ch;
      });

      // Calculate global order: maintain order within each part
      const finalOrder: string[] = [];
      
      if (parts && parts.length > 0) {
        const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);
        
        sortedParts.forEach(part => {
          if (part.id === targetPartId) {
            // Use the new order for the target part
            finalOrder.push(...newOrder);
          } else {
            // Keep existing order for other parts, but remove dragged chapter if it was here
            const partChapterIds = updatedChapters
              .filter(ch => ch.partId === part.id && ch.id !== draggedId)
              .map(ch => ch.id);
            finalOrder.push(...partChapterIds);
          }
        });
        
        // Handle unassigned chapters
        if (!targetPartId) {
          // Target is unassigned - use new order
          finalOrder.push(...newOrder);
        } else {
          // Keep existing unassigned chapters, but remove dragged chapter if it was here
          const unassignedIds = updatedChapters
            .filter(ch => !ch.partId && ch.id !== draggedId)
            .map(ch => ch.id);
          finalOrder.push(...unassignedIds);
        }
      } else {
        // No parts - simple reorder
        finalOrder.push(...newOrder);
      }

      // Create final ordered chapters array with updated partId
      const idToChapter = new Map(updatedChapters.map(ch => [ch.id, ch]));
      const reorderedChapters = finalOrder
        .map(id => idToChapter.get(id))
        .filter((ch): ch is Chapter => !!ch);

      // Apply the reorder - prefer onReorder for full chapter objects
      if (onReorder) {
        onReorder(reorderedChapters);
      } else if (onReorderChapters) {
        // Fallback to ID-based reorder, but also update partId separately
        if (draggedChapter.partId !== targetPartId) {
          updateChapterDetails(draggedId, { partId: targetPartId || undefined });
        }
        onReorderChapters(finalOrder);
      }
    }

    handleDragEnd();
  };

  // Group chapters by part for rendering
  const groupedChapters: Array<{ part: Part | null; chapters: Chapter[] }> = [];
  
  if (parts && parts.length > 0) {
    const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);
    
    sortedParts.forEach(part => {
      const partChapters = chapters.filter(ch => ch.partId === part.id);
      groupedChapters.push({ part, chapters: partChapters });
    });
    
    const unassignedChapters = chapters.filter(ch => !ch.partId);
    if (unassignedChapters.length > 0) {
      groupedChapters.push({ part: null, chapters: unassignedChapters });
    }
  } else {
    groupedChapters.push({ part: null, chapters });
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-700 text-sm uppercase tracking-wide">Chapters</h2>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Add"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={() => startAdding('chapter')}>
                Add Chapter
              </DropdownMenuItem>
              {addPart && (
                <DropdownMenuItem onClick={() => startAdding('part')}>
                  Add Part
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* NEW: Multi-Chapter View - Manuscript Root */}
        {onSelectManuscript && (
          <div
            className={`group relative px-3 py-2.5 border-b border-gray-200 cursor-pointer ${
              selection?.kind === 'manuscript' ? 'bg-blue-200' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <div 
                onClick={onSelectManuscript}
                className="flex-1 min-w-0"
              >
                <div className="text-sm text-gray-900">
                  Full Manuscript
                </div>
                <div className="text-xs text-gray-500">
                  {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
                </div>
              </div>
              {/* NEW: Project info for full manuscript */}
              {onManuscriptInfoClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[ChapterList] Info button clicked for full manuscript');
                    console.log('[ChapterList] Calling onManuscriptInfoClick');
                    onManuscriptInfoClick();
                  }}
                  className="p-1 hover:bg-gray-200 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Manuscript Info"
                >
                  <Info className="w-3 h-3 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        )}
        
        {isAdding && (
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={addingType === 'part' ? 'Part name...' : 'Chapter title...'}
              className="w-full px-2 py-1 border border-gray-300 bg-white text-gray-900 rounded text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveNew();
                if (e.key === 'Escape') cancelNew();
              }}
            />
            <div className="flex gap-1 mt-2">
              <button
                onClick={saveNew}
                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={cancelNew}
                className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {groupedChapters.map((group) => {
          const isCollapsed = !!(group.part && collapsedParts.has(group.part.id));
          
          return (
            <div key={group.part?.id || 'unassigned'}>
              {/* Part Header */}
              {group.part && (
                <PartHeader
                  part={group.part}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => togglePartCollapse(group.part!.id)}
                  isEditing={editingId === group.part.id}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  saveEdit={saveEdit}
                  cancelEdit={cancelEdit}
                  startEditing={startEditing}
                  deletePart={deletePart}
                  onDragStart={() => handleDragStart(group.part!.id, 'part')}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e: React.DragEvent) => handleDragOver(e, group.part!.id, 'part')}
                  onDrop={(e: React.DragEvent) => handleDrop(e, group.part!.id, 'part')}
                  isDragging={draggingItem?.id === group.part.id}
                  isDragOver={dragOverItem?.id === group.part.id}
                  dragPosition={dragOverItem?.id === group.part.id ? dragOverItem.position : null}
                  onSelectPart={onSelectPart}
                  selection={selection}
                  onPartInfoClick={onPartInfoClick}
                />
              )}
              
              {/* Chapters in this group */}
              {!isCollapsed && (
                <div>
                  {group.chapters.length === 0 && group.part && (
                    <div 
                      className="px-3 py-3 text-xs text-gray-400 italic text-center bg-gray-50/50 border-b border-gray-200"
                      onDragOver={(e) => handleDragOver(e, group.part!.id, 'part')}
                      onDrop={(e) => handleDrop(e, group.part!.id, 'part')}
                    >
                      Drag chapters here
                    </div>
                  )}
                  {group.chapters.map((chapter, index) => (
                    <ChapterRow
                      key={chapter.id}
                      chapter={chapter}
                      index={index}
                      chapters={chapters}
                      currentChapterId={currentChapterId}
                      editingId={editingId}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      saveEdit={saveEdit}
                      cancelEdit={cancelEdit}
                      setCurrentChapterId={setCurrentChapterId}
                      startEditing={startEditing}
                      deleteChapter={deleteChapter}
                      onChapterInfoClick={onChapterInfoClick}
                      matches={matches}
                      isActive={isActive}
                      mode={mode}
                      onDragStart={() => handleDragStart(chapter.id, 'chapter')}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e: React.DragEvent) => handleDragOver(e, chapter.id, 'chapter')}
                      onDrop={(e: React.DragEvent) => handleDrop(e, chapter.id, 'chapter')}
                      isDragging={draggingItem?.id === chapter.id}
                      isDragOver={dragOverItem?.id === chapter.id}
                      dragPosition={dragOverItem?.id === chapter.id ? dragOverItem.position : null}
                      inPart={!!group.part}
                      selection={selection}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Part Header Component
function PartHeader({
  part,
  isCollapsed,
  onToggleCollapse,
  isEditing,
  editTitle,
  setEditTitle,
  saveEdit,
  cancelEdit,
  startEditing,
  deletePart,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  dragPosition,
  onSelectPart,
  selection,
  onPartInfoClick
}: PartHeaderProps) {
  return (
    <div
      className={`group relative ${
        selection?.kind === 'part' && selection.partId === part.id ? 'bg-blue-200' : 'bg-gray-100'
      } border-b border-gray-200 ${isDragging ? 'opacity-40' : ''} ${
        isDragOver && dragPosition === 'before' ? 'border-t-2 border-t-blue-500' : ''
      } ${
        isDragOver && dragPosition === 'after' ? 'border-b-2 border-b-blue-500' : ''
      }`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {isEditing ? (
        <div className="p-3 pl-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 bg-white text-gray-900 rounded text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <div className="flex gap-1 mt-2">
            <button onClick={saveEdit} className="p-1 hover:bg-gray-200 rounded">
              <Check className="w-3 h-3 text-green-600" />
            </button>
            <button onClick={cancelEdit} className="p-1 hover:bg-gray-200 rounded">
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2.5 pl-3 flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
          
          <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
          
          <div 
            className={`flex-1 min-w-0 cursor-pointer ${
              selection?.kind === 'part' && selection.partId === part.id ? 'font-semibold' : ''
            }`}
            onClick={() => onSelectPart?.(part.id)}
          >
            <div className="text-xs text-gray-700 uppercase tracking-wider font-medium truncate">
              {part.title}
            </div>
          </div>
          
          {/* Part Info Button */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {onPartInfoClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPartInfoClick(part);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Part Info"
              >
                <Info className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component to handle tag loading for each row
function ChapterRow({ 
  chapter, 
  index,
  chapters,
  currentChapterId, 
  editingId, 
  editTitle, 
  setEditTitle,
  saveEdit,
  cancelEdit,
  setCurrentChapterId,
  startEditing,
  deleteChapter,
  onChapterInfoClick,
  matches,
  isActive,
  mode,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  dragPosition,
  inPart,
  selection
}: ChapterRowProps) {
  const { tags } = useEntityTags('chapter', chapter.id);
  const { getChapterNumber } = useChapterNumbering();
  const visible = !isActive || (tags && matches(tags));
  const dimClass = isActive && !visible && mode === 'dim' ? 'opacity-50 pointer-events-none' : '';
  const hideClass = isActive && !visible && mode === 'hide' ? 'hidden' : '';

  return (
    <div
      className={`group relative ${
        (selection?.kind === 'chapter' && selection.chapterId === chapter.id) ? 'bg-blue-100' : 'hover:bg-gray-50'
      } ${dimClass} ${hideClass} ${isDragging ? 'opacity-40' : ''} ${
        isDragOver && dragPosition === 'before' ? 'border-t-2 border-t-blue-500' : ''
      } ${
        isDragOver && dragPosition === 'after' ? 'border-b-2 border-b-blue-500' : ''
      }`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {editingId === chapter.id ? (
        <div className={`py-2 px-2 ${inPart ? 'pl-8' : 'pl-3'}`}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 bg-white text-gray-900 rounded text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <div className="flex gap-1 mt-2">
            <button
              onClick={saveEdit}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Check className="w-3 h-3 text-green-600" />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`py-1.5 px-2 flex items-start gap-2 border-b border-gray-100 ${inPart ? 'pl-8' : 'pl-3'}`}>
          <div className="w-5 text-xs text-gray-400 mt-0.5 flex-shrink-0">
            {getChapterNumber(chapter.id)}
          </div>
          <GripVertical className="w-3.5 h-3.5 mt-0.5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
          <div 
            onClick={() => setCurrentChapterId(chapter.id)}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <div className="text-sm text-gray-900 truncate">
              {chapter.title}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {chapter.wordCount} words
            </div>
            <div className="mt-1">
              <TagBadges tags={tags || []} max={3} size="xs" />
            </div>
          </div>
          {/* NEW: Compact - Only info button */}
          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
            {onChapterInfoClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[ChapterList] Info button clicked for chapter:', chapter.title);
                  console.log('[ChapterList] Calling onChapterInfoClick');
                  onChapterInfoClick(chapter);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Chapter Info"
              >
                <Info className="w-3 h-3 text-gray-600" />
              </button>
            )}
            {!onChapterInfoClick && (
              <div className="p-1 text-xs text-gray-400" title="Info handler not provided">
                <Info className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
