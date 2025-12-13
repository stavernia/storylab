import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Info,
  GripVertical,
  ChevronRight,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import type { Chapter, Part } from "@/App";
import { TagBadges } from "./tags/TagBadges";
import { useTagFilter, type FilterMode } from "@/contexts/TagFilterContext";
import { useEntityTags } from "@/hooks/useEntityTags";
import { useChapterNumbering } from "@/contexts/ChapterNumberingContext";
import { PLACEHOLDERS } from "@/constants/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type { Tag } from "@/services/tag";

// NEW: Multi-Chapter View - Selection type
type ManuscriptSelection =
  | { kind: "manuscript" }
  | { kind: "part"; partId: string }
  | { kind: "chapter"; chapterId: string };

type ChapterListProps = {
  chapters: Chapter[];
  currentChapterId: string;
  setCurrentChapterId: (id: string) => void;
  addChapter: (
    title?: string,
    options?: { selection?: ManuscriptSelection; afterChapterId?: string },
  ) => Promise<string>;
  deleteChapter: (id: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterDetails?: (id: string, updates: Partial<Chapter>) => void;
  onChapterInfoClick?: (chapter: Chapter) => void;
  onReorder?: (chapters: Chapter[]) => void;
  onReorderChapters?: (orderedIds: string[]) => void;
  parts?: Part[];
  addPart?: (data: { title: string; notes?: string }) => Promise<Part>;
  deletePart?: (
    id: string,
    action?: { mode: "delete" | "move"; targetPartId?: string | null },
  ) => void;
  updatePartTitle?: (id: string, name: string) => void;
  reorderParts?: (parts: Part[]) => void;
  onSelectManuscript?: () => void; // NEW: Multi-Chapter View
  onSelectPart?: (partId: string) => void; // NEW: Multi-Chapter View
  selection?: ManuscriptSelection; // NEW: Multi-Chapter View
  onManuscriptInfoClick?: () => void; // NEW: Project info for full manuscript
  onPartInfoClick?: (part: Part) => void; // NEW: Part info
  showPartTitles?: boolean;
  showChapterTitles?: boolean;
};

type DragPosition = "before" | "after" | null;

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
  deletePart?: (
    id: string,
    action?: { mode: "delete" | "move"; targetPartId?: string | null },
  ) => void;
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
  showPartTitles: boolean;
  onRequestDelete: (part: Part) => void;
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
  showChapterTitles: boolean;
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
  updatePartTitle,
  reorderParts,
  onSelectManuscript,
  onSelectPart,
  selection,
  onManuscriptInfoClick,
  onPartInfoClick,
  showPartTitles = true,
  showChapterTitles = true,
}: ChapterListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [addingType, setAddingType] = useState<"chapter" | "part" | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [collapsedParts, setCollapsedParts] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePartState, setDeletePartState] = useState<{
    part: Part | null;
    mode: "delete" | "move";
    targetPartId: string | null;
  }>({ part: null, mode: "delete", targetPartId: null });

  // Drag-and-drop state
  const [draggingItem, setDraggingItem] = useState<{
    id: string;
    type: "chapter" | "part";
  } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{
    id: string;
    type: "chapter" | "part";
    position: "before" | "after";
  } | null>(null);

  // Tag filtering
  const { matches, isActive, mode } = useTagFilter();

  // Use a stable ordering source for rendering and drag calculations
  const sortedChapters = [...chapters].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  // Create ordered list of items (parts and chapters in correct order)
  const orderedItems: Array<
    { type: "part"; data: Part } | { type: "chapter"; data: Chapter }
  > = [];

  if (parts && parts.length > 0) {
    const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);

    sortedParts.forEach((part) => {
      // Add the part itself
      orderedItems.push({ type: "part", data: part });

      // Add chapters in this part (maintain their original order)
      const partChapters = sortedChapters.filter((ch) => ch.partId === part.id);
      partChapters.forEach((chapter) => {
        orderedItems.push({ type: "chapter", data: chapter });
      });
    });

    // Add unassigned chapters at the end
    const unassignedChapters = sortedChapters.filter((ch) => !ch.partId);
    unassignedChapters.forEach((chapter) => {
      orderedItems.push({ type: "chapter", data: chapter });
    });
  } else {
    // No parts, just show all chapters
    sortedChapters.forEach((chapter) => {
      orderedItems.push({ type: "chapter", data: chapter });
    });
  }

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      const chapter = chapters.find((ch) => ch.id === editingId);
      const part = parts?.find((p) => p.id === editingId);

      if (chapter) {
        updateChapterTitle(editingId, editTitle.trim());
      } else if (part && updatePartTitle) {
        updatePartTitle(editingId, editTitle.trim());
      }
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const openAddDialog = (type: "chapter" | "part") => {
    setAddingType(type);
    setNewTitle("");
    setIsAddDialogOpen(true);
  };

  const closeAddDialog = () => {
    setAddingType(null);
    setNewTitle("");
    setIsAddDialogOpen(false);
  };

  useEffect(() => {
    if (isAddDialogOpen) {
      titleInputRef.current?.focus();
    }
  }, [isAddDialogOpen]);

  const saveNew = async () => {
    const trimmed = newTitle.trim();
    if (!addingType || !trimmed) {
      closeAddDialog();
      return;
    }

    if (addingType === "chapter") {
      const newId = await addChapter(trimmed, {
        selection,
        afterChapterId: selection?.kind === "chapter" ? selection.chapterId : undefined,
      });
      if (newId) {
        setCurrentChapterId(newId);
      }
    } else if (addingType === "part" && addPart) {
      const part = await addPart({ title: trimmed });
      onSelectPart?.(part.id);
    }

    closeAddDialog();
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

  const openDeletePartDialog = (part: Part) => {
    const partChapters = chapters.filter((ch) => ch.partId === part.id);
    if (!deletePart) return;

    if (partChapters.length === 0) {
      deletePart(part.id);
      return;
    }

    const otherParts = (parts || []).filter((p) => p.id !== part.id);
    const defaultTarget = otherParts[0]?.id ?? null;
    setDeletePartState({
      part,
      mode: "delete",
      targetPartId: defaultTarget,
    });
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletePartState({ part: null, mode: "delete", targetPartId: null });
  };

  const confirmDeletePart = () => {
    if (!deletePart || !deletePartState.part) return;

    const otherParts = (parts || []).filter((p) => p.id !== deletePartState.part?.id);
    const resolvedTarget =
      deletePartState.mode === "move" && otherParts.length > 0
        ? deletePartState.targetPartId || otherParts[0]?.id || null
        : deletePartState.targetPartId;

    const action =
      deletePartState.mode === "move"
        ? { mode: "move" as const, targetPartId: resolvedTarget }
        : { mode: "delete" as const };

    deletePart(deletePartState.part.id, action);
    closeDeleteDialog();
  };

  const handleDragStart = (id: string, type: "chapter" | "part") => {
    setDraggingItem({ id, type });
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    id: string,
    type: "chapter" | "part",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingItem) return;

    // Determine position based on mouse Y position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? "before" : "after";

    setDragOverItem({ id, type, position });
  };

  const handleDrop = (
    e: React.DragEvent,
    targetId: string,
    targetType: "chapter" | "part",
  ) => {
    e.preventDefault();

    if (!draggingItem || !dragOverItem) return;
    if (draggingItem.id === targetId) {
      handleDragEnd();
      return;
    }

    const { id: draggedId, type: draggedType } = draggingItem;
    const { position } = dragOverItem;

    // Handle part reordering
    if (
      draggedType === "part" &&
      targetType === "part" &&
      reorderParts &&
      parts
    ) {
      const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);
      const sourceIndex = sortedParts.findIndex((p) => p.id === draggedId);
      const targetIndex = sortedParts.findIndex((p) => p.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const newParts = [...sortedParts];
      const [moved] = newParts.splice(sourceIndex, 1);

      // Adjust target index if inserting after
      const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
      const adjustedIndex =
        sourceIndex < targetIndex ? insertIndex - 1 : insertIndex;

      newParts.splice(Math.min(adjustedIndex, newParts.length), 0, moved);

      // Update sortOrder
      const withOrder = newParts.map((p, i) => ({ ...p, sortOrder: i }));
      reorderParts(withOrder);
    }

    // Handle chapter reordering and part assignment
    else if (
      draggedType === "chapter" &&
      updateChapterDetails &&
      (onReorderChapters || onReorder)
    ) {
      const draggedChapter = sortedChapters.find((ch) => ch.id === draggedId);
      if (!draggedChapter) return;

      // Determine target part and position
      const hasParts = parts && parts.length > 0;
      let targetPartId: string | null = null;
      let targetChapterId: string | null = null;

      if (targetType === "part") {
        // Dropping on a part header - assign to that part
        targetPartId = targetId;
      } else if (targetType === "chapter") {
        // Dropping on a chapter - use that chapter's part and position
        const targetChapter = sortedChapters.find((ch) => ch.id === targetId);
        targetPartId = targetChapter?.partId || null;
        targetChapterId = targetId;
      }

      // Prevent moving to root when parts exist
      if (!targetPartId && hasParts) {
        const sortedParts = [...(parts || [])].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        targetPartId = sortedParts[sortedParts.length - 1]?.id || null;
      }

      // Get all chapters for the target part
      const targetPartChapters = sortedChapters.filter((ch) =>
        targetPartId ? ch.partId === targetPartId : !ch.partId,
      );

      // Create new order within target part
      let newOrder: string[];

      if (targetChapterId) {
        // Dropping relative to another chapter
        const targetPartIds = targetPartChapters
          .map((ch) => ch.id)
          .filter((id) => id !== draggedId);
        const targetIndex = targetPartIds.indexOf(targetChapterId);

        if (targetIndex !== -1) {
          const insertIndex =
            position === "before" ? targetIndex : targetIndex + 1;
          targetPartIds.splice(insertIndex, 0, draggedId);
          newOrder = targetPartIds;
        } else {
          newOrder = [...targetPartIds, draggedId];
        }
      } else {
        // Dropping on a part header - insert relative to the header position
        const targetPartIds = targetPartChapters
          .map((ch) => ch.id)
          .filter((id) => id !== draggedId);
        const insertIndex = position === "before" ? 0 : targetPartIds.length;
        targetPartIds.splice(insertIndex, 0, draggedId);
        newOrder = targetPartIds;
      }

      // Build complete reordered chapter list with updated partId
      const updatedChapters = sortedChapters.map((ch) => {
        if (ch.id === draggedId) {
          // Update the dragged chapter's partId
          return { ...ch, partId: targetPartId || undefined };
        }
        return ch;
      });

      // Calculate global order: maintain order within each part
      const finalOrder: string[] = [];

      if (parts && parts.length > 0) {
        const sortedParts = [...parts].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );

        sortedParts.forEach((part) => {
          if (part.id === targetPartId) {
            // Use the new order for the target part
            finalOrder.push(...newOrder);
          } else {
            // Keep existing order for other parts, but remove dragged chapter if it was here
            const partChapterIds = updatedChapters
              .filter((ch) => ch.partId === part.id && ch.id !== draggedId)
              .map((ch) => ch.id);
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
            .filter((ch) => !ch.partId && ch.id !== draggedId)
            .map((ch) => ch.id);
          finalOrder.push(...unassignedIds);
        }
      } else {
        // No parts - simple reorder
        finalOrder.push(...newOrder);
      }

      // Create final ordered chapters array with updated partId
      const idToChapter = new Map(updatedChapters.map((ch) => [ch.id, ch]));
      const reorderedChapters = finalOrder
        .map((id) => idToChapter.get(id))
        .filter((ch): ch is Chapter => !!ch);

      // Apply the reorder - prefer onReorder for full chapter objects
      if (onReorder) {
        onReorder(reorderedChapters);
      } else if (onReorderChapters) {
        // Fallback to ID-based reorder, but also update partId separately
        if (draggedChapter.partId !== targetPartId) {
          updateChapterDetails(draggedId, {
            partId: targetPartId || undefined,
          });
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

    sortedParts.forEach((part) => {
      const partChapters = sortedChapters.filter((ch) => ch.partId === part.id);
      groupedChapters.push({ part, chapters: partChapters });
    });

    const unassignedChapters = sortedChapters.filter((ch) => !ch.partId);
    if (unassignedChapters.length > 0) {
      groupedChapters.push({ part: null, chapters: unassignedChapters });
    }
  } else {
    groupedChapters.push({ part: null, chapters: sortedChapters });
  }

  const deleteDialogPart = deletePartState.part;
  const deleteDialogChapters = deleteDialogPart
    ? chapters.filter((ch) => ch.partId === deleteDialogPart.id)
    : [];
  const deleteDialogOtherParts = deleteDialogPart
    ? (parts || []).filter((p) => p.id !== deleteDialogPart.id)
    : [];

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-700 text-sm uppercase tracking-wide">
            Chapters
          </h2>

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
              <DropdownMenuItem onClick={() => openAddDialog("chapter")}>
                Add Chapter
              </DropdownMenuItem>
              {addPart && (
                <DropdownMenuItem onClick={() => openAddDialog("part")}>
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
              selection?.kind === "manuscript"
                ? "bg-blue-200"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <div onClick={onSelectManuscript} className="flex-1 min-w-0">
                <div className="text-sm text-gray-900">Full Manuscript</div>
                <div className="text-xs text-gray-500">
                  {chapters.length}{" "}
                  {chapters.length === 1 ? "chapter" : "chapters"}
                </div>
              </div>
              {/* NEW: Project info for full manuscript */}
              {onManuscriptInfoClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "[ChapterList] Info button clicked for full manuscript",
                    );
                    console.log("[ChapterList] Calling onManuscriptInfoClick");
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

        {groupedChapters.map((group) => {
          const isCollapsed = !!(
            group.part && collapsedParts.has(group.part.id)
          );

          return (
            <div key={group.part?.id || "unassigned"}>
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
                  onDragStart={() => handleDragStart(group.part!.id, "part")}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e: React.DragEvent) =>
                    handleDragOver(e, group.part!.id, "part")
                  }
                  onDrop={(e: React.DragEvent) =>
                    handleDrop(e, group.part!.id, "part")
                  }
                  isDragging={draggingItem?.id === group.part.id}
                  isDragOver={dragOverItem?.id === group.part.id}
                  dragPosition={
                    dragOverItem?.id === group.part.id
                      ? dragOverItem.position
                      : null
                  }
                  onSelectPart={onSelectPart}
                  selection={selection}
                  onPartInfoClick={onPartInfoClick}
                  showPartTitles={showPartTitles}
                  onRequestDelete={openDeletePartDialog}
                />
              )}

              {/* Chapters in this group */}
              {!isCollapsed && (
                <div>
                  {group.chapters.length === 0 && group.part && (
                    <div
                      className="px-3 py-3 text-xs text-gray-400 italic text-center bg-gray-50/50 border-b border-gray-200"
                      onDragOver={(e) =>
                        handleDragOver(e, group.part!.id, "part")
                      }
                      onDrop={(e) => handleDrop(e, group.part!.id, "part")}
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
                      onDragStart={() => handleDragStart(chapter.id, "chapter")}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e: React.DragEvent) =>
                        handleDragOver(e, chapter.id, "chapter")
                      }
                      onDrop={(e: React.DragEvent) =>
                        handleDrop(e, chapter.id, "chapter")
                      }
                      isDragging={draggingItem?.id === chapter.id}
                      isDragOver={dragOverItem?.id === chapter.id}
                      dragPosition={
                        dragOverItem?.id === chapter.id
                          ? dragOverItem.position
                          : null
                      }
                      inPart={!!group.part}
                    selection={selection}
                    showChapterTitles={showChapterTitles}
                  />
                ))}
                </div>
              )}
            </div>
          );
        })}

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeAddDialog();
            }
          }}
        >
          <DialogContent
            className="max-w-md"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveNew();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                closeAddDialog();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {addingType === "part" ? "Add Part" : "Add Chapter"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                ref={titleInputRef}
                placeholder={
                  addingType === "part"
                    ? PLACEHOLDERS.PART_TITLE
                    : PLACEHOLDERS.CHAPTER_TITLE
                }
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddDialog}
                  className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNew}
                  className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeDeleteDialog();
            } else {
              setIsDeleteDialogOpen(true);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Part</DialogTitle>
            </DialogHeader>

            {deleteDialogPart && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  {deleteDialogChapters.length > 0
                    ? `${deleteDialogChapters.length} chapter(s) are inside “${deleteDialogPart.title || "Untitled Part"}”.`
                    : "This part is empty."}
                </p>

                {deleteDialogChapters.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="delete-part-chapters"
                        type="radio"
                        checked={deletePartState.mode === "delete"}
                        onChange={() => setDeletePartState((prev) => ({ ...prev, mode: "delete" }))}
                      />
                      <label htmlFor="delete-part-chapters" className="text-sm text-gray-800">
                        Delete chapters
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          id="move-part-chapters"
                          type="radio"
                          checked={deletePartState.mode === "move"}
                          onChange={() =>
                            setDeletePartState((prev) => ({
                              ...prev,
                              mode: "move",
                              targetPartId:
                                deleteDialogOtherParts[0]?.id ?? prev.targetPartId ?? null,
                            }))
                          }
                        />
                        <label htmlFor="move-part-chapters" className="text-sm text-gray-800">
                          Move chapters
                          {deleteDialogOtherParts.length === 0
                            ? " to root"
                            : " to another part"}
                        </label>
                      </div>

                      {deletePartState.mode === "move" && (
                        <div className="ml-6">
                          {deleteDialogOtherParts.length > 0 ? (
                            <select
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={deletePartState.targetPartId || ""}
                              onChange={(e) =>
                                setDeletePartState((prev) => ({
                                  ...prev,
                                  targetPartId: e.target.value || null,
                                }))
                              }
                            >
                              {deleteDialogOtherParts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.title || `Part ${p.sortOrder + 1}`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-sm text-gray-600">Chapters will be moved to the root level.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeDeleteDialog}
                    className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeletePart}
                    className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
  onPartInfoClick,
  showPartTitles,
  onRequestDelete,
}: PartHeaderProps) {
  const { getPartNumber } = useChapterNumbering();
  const partLabel =
    showPartTitles && part.title?.trim()
      ? part.title.trim()
      : `Part ${getPartNumber(part.id)}`;

  return (
    <div
      className={`group relative ${
        selection?.kind === "part" && selection.partId === part.id
          ? "bg-blue-200"
          : "bg-gray-100"
      } border-b border-gray-200 ${isDragging ? "opacity-40" : ""} ${
        isDragOver && dragPosition === "before"
          ? "border-t-2 border-t-blue-500"
          : ""
      } ${
        isDragOver && dragPosition === "after"
          ? "border-b-2 border-b-blue-500"
          : ""
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
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
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
              selection?.kind === "part" && selection.partId === part.id
                ? "font-semibold"
                : ""
            }`}
            onClick={() => onSelectPart?.(part.id)}
          >
            <div className="text-xs text-gray-700 uppercase tracking-wider font-medium truncate">
              {partLabel}
            </div>
          </div>

          {/* Part Info Button */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing(part.id, part.title || partLabel);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Rename part"
            >
              <Edit2 className="w-3 h-3 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(part);
              }}
              className="p-1 hover:bg-red-50 rounded"
              title="Delete part"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
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
  selection,
  showChapterTitles,
}: ChapterRowProps) {
  const { tags } = useEntityTags("chapter", chapter.id);
  const { getChapterNumber } = useChapterNumbering();
  const chapterLabel =
    showChapterTitles && chapter.title?.trim()
      ? chapter.title.trim()
      : `Chapter ${getChapterNumber(chapter.id)}`;
  const wordCount = chapter.wordCount ?? 0;
  const visible = !isActive || (tags && matches(tags));
  const dimClass =
    isActive && !visible && mode === "dim"
      ? "opacity-50 pointer-events-none"
      : "";
  const hideClass = isActive && !visible && mode === "hide" ? "hidden" : "";

  return (
    <div
      className={`group relative ${
        selection?.kind === "chapter" && selection.chapterId === chapter.id
          ? "bg-blue-100"
          : "hover:bg-gray-50"
      } ${dimClass} ${hideClass} ${isDragging ? "opacity-40" : ""} ${
        isDragOver && dragPosition === "before"
          ? "border-t-2 border-t-blue-500"
          : ""
      } ${
        isDragOver && dragPosition === "after"
          ? "border-b-2 border-b-blue-500"
          : ""
      }`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {editingId === chapter.id ? (
        <div className={`py-2 px-2 ${inPart ? "pl-8" : "pl-3"}`}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 bg-white text-gray-900 rounded text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
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
        <div
          className={`py-1.5 px-2 flex items-start gap-2 border-b border-gray-100 ${inPart ? "pl-8" : "pl-3"}`}
        >
          <div className="w-5 text-xs text-gray-400 mt-0.5 flex-shrink-0">
            {getChapterNumber(chapter.id)}
          </div>
          <GripVertical className="w-3.5 h-3.5 mt-0.5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
          <div
            onClick={() => setCurrentChapterId(chapter.id)}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <div className="text-sm text-gray-900 truncate">
              {chapterLabel}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {wordCount} words
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
                  console.log(
                    "[ChapterList] Info button clicked for chapter:",
                    chapter.title,
                  );
                  console.log("[ChapterList] Calling onChapterInfoClick");
                  onChapterInfoClick(chapter);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Chapter Info"
              >
                <Info className="w-3 h-3 text-gray-600" />
              </button>
            )}
            {!onChapterInfoClick && (
              <div
                className="p-1 text-xs text-gray-400"
                title="Info handler not provided"
              >
                <Info className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
