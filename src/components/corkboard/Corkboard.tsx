import { useState, useEffect, useCallback, useRef } from "react";
import { DndProvider, useDragLayer } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Search,
  Plus,
  LayoutGrid,
  LayoutList,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CorkboardCard, corkboardApi, CorkboardBoard } from "@/api/corkboard";
import { CardInfoForm } from "@/components/info-forms/CardInfoForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getBetweenRank,
  getInitialRank,
  rebalanceRanks,
} from "@/utils/lexorank";
import { seedCorkboard } from "@/utils/seed-corkboard";
import { useTagFilter } from "@/contexts/TagFilterContext";
import { tagService, Tag } from "@/services/tag";
import { toast } from "sonner";
import { useInspector } from "@/contexts/InspectorContext";
import { ChapterList } from "@/components/ChapterList";
import { ResizableSidebar } from "@/components/shared/ResizableSidebar";
import type { Chapter, Part } from "@/App";
import { CorkboardCard as CorkboardCardComponent } from "./CorkboardCard";
import { CorkboardRow } from "./CorkboardRow";
import { CorkboardListView } from "./CorkboardListView";

interface CorkboardProps {
  bookId: string | null;
  chapters: Chapter[];
  parts?: Part[];
  bookTitle?: string; // Add book title prop
  addPart?: (data: { title: string; notes?: string }) => Promise<Part>;
  deletePart?: (id: string) => void;
  updatePartTitle?: (id: string, name: string) => void;
  reorderParts?: (parts: Part[]) => void;
  updateChapterTitle?: (id: string, title: string) => void;
  updateChapterDetails?: (id: string, updates: Partial<Chapter>) => void;
  deleteChapter?: (id: string) => void;
  addChapter?: (title?: string) => Promise<string>;
  reorderChapters?: (chapters: Chapter[]) => void;
  // NEW: UI Cohesion - Lifted state for Context Bar controls
  displayMode?: CorkboardDisplayMode;
  onDisplayModeChange?: (mode: CorkboardDisplayMode) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  leftSidebarOpen: boolean; // Changed from optional to required
  setLeftSidebarOpen?: (open: boolean) => void; // NEW: For SideTab
  setSelectionLabel?: (label: string) => void;
  // NEW: Selection state from parent (like ManuscriptView and OutlineView)
  selection: ManuscriptSelection;
  onSelectionChange?: (selection: ManuscriptSelection) => void;
}

// Selection types (matching ManuscriptView)
type ManuscriptSelection =
  | { kind: "manuscript" }
  | { kind: "part"; partId: string }
  | { kind: "chapter"; chapterId: string };

// Display mode for cards
type CorkboardDisplayMode = "cards" | "list";

// Row type definition for multi-scope
type CorkboardRowType =
  | { type: "book" }
  | { type: "part"; partId: string; partTitle: string }
  | {
      type: "chapter";
      chapterId: string;
      chapterTitle: string;
      partId?: string | null;
    };

export function Corkboard({
  bookId,
  chapters,
  parts = [],
  bookTitle, // Add book title prop
  addPart,
  deletePart,
  updatePartTitle,
  reorderParts,
  updateChapterTitle,
  updateChapterDetails,
  deleteChapter,
  addChapter,
  reorderChapters,
  // NEW: UI Cohesion - Lifted state for Context Bar controls
  displayMode,
  onDisplayModeChange,
  searchQuery,
  onSearchQueryChange,
  leftSidebarOpen,
  setLeftSidebarOpen,
  setSelectionLabel,
  // NEW: Selection state from parent (like ManuscriptView and OutlineView)
  selection,
  onSelectionChange,
}: CorkboardProps) {
  const [cards, setCards] = useState<CorkboardCard[]>([]);
  const [boards, setBoards] = useState<CorkboardBoard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CorkboardCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardFormValues, setCardFormValues] = useState<Partial<CorkboardCard>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const [cardTags, setCardTags] = useState<Tag[]>([]);

  // NEW: Use prop-based state for binder instead of internal state
  // The leftSidebarOpen prop comes from App.tsx and is shared across views

  // Use the selection from props instead of internal state
  // Keep localSelection as a fallback for backward compatibility
  const effectiveSelection = selection;

  // Tag filtering
  const { matches, mode, isActive } = useTagFilter();

  // Inspector v2
  const { openInspector, closeInspector } = useInspector();

  // Selection handlers (matching ManuscriptView)
  const handleSelectManuscript = () => {
    onSelectionChange?.({ kind: "manuscript" });
  };

  const handleSelectPart = (partId: string) => {
    onSelectionChange?.({ kind: "part", partId });
  };

  const handleSelectChapter = (chapterId: string) => {
    onSelectionChange?.({ kind: "chapter", chapterId });
  };

  // Handlers for chapter list
  const handleReorderChapters = (orderedIds: string[]) => {
    if (reorderChapters) {
      const idToChapter = new Map(chapters.map((ch) => [ch.id, ch]));
      const reordered = orderedIds
        .map((id) => idToChapter.get(id))
        .filter((ch): ch is Chapter => !!ch);
      reorderChapters(reordered);
    }
  };

  const handleReorder = (reorderedChapters: Chapter[]) => {
    if (reorderChapters) {
      reorderChapters(reorderedChapters);
    }
  };

  // Compute visible rows based on selection
  const sortedChapters = [...chapters].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);

  const computeVisibleRows = (): CorkboardRowType[] => {
    const rows: CorkboardRowType[] = [];

    if (effectiveSelection.kind === "manuscript") {
      // Full Manuscript: Book row + all parts with their chapters
      rows.push({ type: "book" });

      sortedParts.forEach((part) => {
        rows.push({ type: "part", partId: part.id, partTitle: part.title });

        // Add all chapters for this part
        const partChapters = sortedChapters.filter(
          (ch) => ch.partId === part.id,
        );
        partChapters.forEach((chapter) => {
          rows.push({
            type: "chapter",
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            partId: part.id,
          });
        });
      });

      // Add chapters without a part
      const unpartedChapters = sortedChapters.filter((ch) => !ch.partId);
      unpartedChapters.forEach((chapter) => {
        rows.push({
          type: "chapter",
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          partId: null,
        });
      });
    } else if (effectiveSelection.kind === "part") {
      // Part selected: Part row + all its chapter rows
      const part = sortedParts.find((p) => p.id === effectiveSelection.partId);
      if (part) {
        rows.push({ type: "part", partId: part.id, partTitle: part.title });

        const partChapters = sortedChapters.filter(
          (ch) => ch.partId === part.id,
        );
        partChapters.forEach((chapter) => {
          rows.push({
            type: "chapter",
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            partId: part.id,
          });
        });
      }
    } else {
      // Chapter selected: (Optional parent part row) + chapter row
      const chapter = sortedChapters.find(
        (ch) => ch.id === effectiveSelection.chapterId,
      );
      if (chapter) {
        // Add parent part row if exists
        if (chapter.partId) {
          const part = sortedParts.find((p) => p.id === chapter.partId);
          if (part) {
            rows.push({ type: "part", partId: part.id, partTitle: part.title });
          }
        }

        rows.push({
          type: "chapter",
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          partId: chapter.partId,
        });
      }
    }

    return rows;
  };

  const visibleRows = computeVisibleRows();

  // Inspector handler for card details
  const handleOpenCardInspector = (card: CorkboardCard) => {
    setSelectedCard(card);
    setCardFormValues({
      title: card.title,
      summary: card.summary,
      notes: card.notes,
      chapterId: card.chapterId,
      color: card.color,
      scope: card.scope,
      partId: card.partId,
    });
    loadCardTags(card.id);
  };

  // NEW: Inspector v2 - Handler for opening chapter info from binder
  const handleOpenChapterInspector = async (chapter: Chapter) => {
    // Load tags for this chapter
    let tags: Tag[] = [];
    try {
      tags = bookId
        ? await tagService.listForEntity("chapter", chapter.id, bookId)
        : [];
    } catch (error) {
      console.error("Failed to load chapter tags:", error);
    }

    // Phase 1.5: Use NEW structured data API
    openInspector(
      {
        type: "chapter",
        id: chapter.id,
        data: {
          chapter: chapter,
          tags,
          parts: parts || [],
        },
      },
      "inspector",
    );
  };

  // Update inspector content ONLY when selectedCard changes (on card selection)
  useEffect(() => {
    if (selectedCard) {
      openInspector({
        title: selectedCard.title,
        subtitle: "Card",
        icon: <Layers className="w-5 h-5" />,
        content: (
          <CardInfoForm
            card={selectedCard}
            chapters={chapters}
            onChange={(updates) => {
              // Update cardFormValues without triggering re-render of inspector
              setCardFormValues((prev) => ({ ...prev, ...updates }));
            }}
            tags={cardTags}
            onTagsChange={setCardTags}
            onSave={async (updates) => {
              setIsSaving(true);
              try {
                await handleUpdateCard(selectedCard.id, updates);
              } finally {
                setIsSaving(false);
              }
            }}
            onTagsSave={async (newTags) => {
              setIsSaving(true);
              try {
                if (bookId) {
                  await tagService.syncEntityTags(
                    "card",
                    selectedCard.id,
                    newTags,
                    bookId,
                  );
                }
              } finally {
                setIsSaving(false);
              }
            }}
            isSaving={isSaving}
            showSaveStatus={true}
          />
        ),
      });
    }
  }, [selectedCard?.id, bookId]); // Only re-run when card ID changes

  // Handle save from Inspector
  const handleSaveCard = async () => {
    if (!bookId) {
      toast.error("Select a book before saving cards");
      return;
    }

    if (!selectedCard) return;
    if (!cardFormValues.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSaving(true);
    try {
      // Update card details
      await handleUpdateCard(selectedCard.id, cardFormValues);

      // Sync tags
      if (bookId) {
        await tagService.syncEntityTags(
          "card",
          selectedCard.id,
          cardTags,
          bookId,
        );
      }

      setSelectedCard(null);
      closeInspector();
      toast.success("Card saved");
    } catch (error) {
      console.error("Error updating card:", error);
      toast.error("Failed to update card");
    } finally {
      setIsSaving(false);
    }
  };

  // Load tags when a card is selected
  useEffect(() => {
    if (selectedCard) {
      loadCardTags(selectedCard.id);
    } else {
      setCardTags([]);
    }
  }, [selectedCard?.id, bookId]);

  const loadCardTags = async (cardId: string) => {
    // Guard: don't load if cardId is empty or invalid
    if (!cardId || cardId.trim() === "") {
      setCardTags([]);
      return;
    }

    try {
      const tags = bookId
        ? await tagService.listForEntity("card", cardId, bookId)
        : [];
      setCardTags(tags);
    } catch (error) {
      console.error("Failed to load card tags:", error);
      setCardTags([]);
    }
  };

  // Load cards and boards when book changes
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!bookId) {
        setCards([]);
        setBoards([]);
        setCurrentBoardId(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await loadBoardsAndInit(bookId);
        await loadCards(bookId);
      } catch (error) {
        console.error("Error loading corkboard data:", error);
        toast.error("Failed to load corkboard");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [bookId, chapters.length]);

  const loadBoardsAndInit = async (activeBookId: string) => {
    try {
      const loadedBoards = await corkboardApi.loadBoards(activeBookId);

      // If no boards, create default main board
      if (loadedBoards.length === 0) {
        const mainBoard = await corkboardApi.createBoard(activeBookId, {
          name: "Main Board",
          description: "Default story board",
          sortOrder: 0,
        });
        setBoards([mainBoard]);
        setCurrentBoardId(mainBoard.id);
      } else {
        setBoards(loadedBoards);
        setCurrentBoardId(loadedBoards[0].id);
      }
    } catch (error) {
      console.error("Error loading boards:", error);
      // Fallback to default board in state only
      const mainBoard: CorkboardBoard = {
        bookId: activeBookId,
        id: "main-board",
        name: "Main Board",
        description: "Default story board",
      };
      setBoards([mainBoard]);
      setCurrentBoardId(mainBoard.id);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleCreateCard("book", null, null); // Default to book-level card
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadCards = async (activeBookId: string) => {
    try {
      const loadedCards = await corkboardApi.loadCards(activeBookId);

      // Ensure backward compatibility: set default scope to 'chapter' if not present
      const normalizedCards = loadedCards.map((card) => ({
        ...card,
        scope: card.scope || ("chapter" as const),
      }));

      setCards(normalizedCards);

      // Seed demo cards if empty and we have chapters
      if (loadedCards.length === 0 && chapters.length > 0) {
        await seedCorkboard(
          activeBookId,
          chapters.map((ch) => ch.id),
        );
        // Reload cards after seeding
        const newCards = await corkboardApi.loadCards(activeBookId);
        const normalizedNewCards = newCards.map((card) => ({
          ...card,
          scope: card.scope || ("chapter" as const),
        }));
        setCards(normalizedNewCards);
      }
    } catch (error) {
      console.error("Error loading cards:", error);
      toast.error("Failed to load cards");
    }
  };

  const handleCreateCard = async (
    scope: "book" | "part" | "chapter",
    partId: string | null,
    chapterId: string | null,
  ) => {
    if (!bookId) {
      toast.error("Select a book before creating cards");
      return;
    }

    if (!currentBoardId) {
      toast.error("Create a board before adding cards");
      return;
    }

    // Get existing cards for this row to calculate rank
    const rowCards = cards
      .filter((c) => {
        if (scope === "book") {
          return c.scope === "book" && c.boardId === currentBoardId;
        } else if (scope === "part") {
          return (
            c.scope === "part" &&
            c.partId === partId &&
            c.boardId === currentBoardId
          );
        } else {
          return (
            c.scope === "chapter" &&
            c.chapterId === chapterId &&
            c.boardId === currentBoardId
          );
        }
      })
      .sort((a, b) => a.laneRank.localeCompare(b.laneRank));

    const newRank =
      rowCards.length > 0
        ? getBetweenRank(rowCards[rowCards.length - 1].laneRank, undefined)
        : getInitialRank();

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newCard: CorkboardCard = {
      id: tempId,
      bookId,
      title: "New Card",
      scope,
      partId,
      chapterId: scope === "chapter" ? chapterId : null,
      laneRank: newRank,
      createdAt: now,
      updatedAt: now,
      boardId: currentBoardId || null,
      x: null,
      y: null,
    };

    // Optimistic update
    setCards([...cards, newCard]);

    const originalCards = [...cards];

    try {
      const created = await corkboardApi.createCard(bookId, {
        title: newCard.title,
        scope: newCard.scope,
        partId: newCard.partId,
        chapterId: newCard.chapterId,
        laneRank: newCard.laneRank,
        boardId: newCard.boardId,
        x: newCard.x,
        y: newCard.y,
      });
      setCards((prev) =>
        prev.map((card) => (card.id === tempId ? created : card)),
      );
      toast.success("Card created");

      // Open inspector for new card
      handleOpenCardInspector(created);
    } catch (error) {
      console.error("Error creating card:", error);
      setCards(originalCards);
      toast.error("Failed to create card");
    }
  };

  const handleUpdateCard = async (
    cardId: string,
    updates: Partial<CorkboardCard>,
  ) => {
    if (!bookId) {
      toast.error("Select a book before updating cards");
      return;
    }

    const originalCards = [...cards];

    // Optimistic update
    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, ...updates } : c,
    );
    setCards(updatedCards);

    // Don't update selectedCard here - let CardInfoForm manage its own state
    // This prevents the useEffect from re-running and re-opening the inspector

    try {
      const updated = await corkboardApi.updateCard(bookId, cardId, updates);
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...updated } : c)),
      );
      setSelectedCard((prev) =>
        prev && prev.id === cardId ? { ...prev, ...updated } : prev,
      );
    } catch (error) {
      console.error("Error updating card:", error);
      setCards(originalCards);
      toast.error("Failed to update card");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!bookId) {
      toast.error("Select a book before deleting cards");
      return;
    }

    const originalCards = [...cards];

    // Optimistic update
    setCards(cards.filter((c) => c.id !== cardId));

    try {
      await corkboardApi.deleteCard(bookId, cardId);
      toast.success("Card deleted");
    } catch (error) {
      console.error("Error deleting card:", error);
      setCards(originalCards);
      toast.error("Failed to delete card");
    }
  };

  const handleCardDrop = async (
    cardId: string,
    targetRowType: "book" | "part" | "chapter",
    targetPartId: string | null,
    targetChapterId: string | null,
  ) => {
    if (!bookId) {
      toast.error("Select a book before moving cards");
      return;
    }

    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const originalCards = [...cards];

    // Calculate new rank in target row
    const targetRowCards = cards
      .filter((c) => {
        if (c.id === cardId) return false; // Exclude the dragged card

        // Use same boardId logic as filteredCards
        const matchesBoard =
          c.boardId === currentBoardId ||
          (!c.boardId && currentBoardId === "main-board");
        if (!matchesBoard) return false;

        if (targetRowType === "book") {
          return c.scope === "book";
        } else if (targetRowType === "part") {
          return c.scope === "part" && c.partId === targetPartId;
        } else {
          return c.scope === "chapter" && c.chapterId === targetChapterId;
        }
      })
      .sort((a, b) => a.laneRank.localeCompare(b.laneRank));

    const newRank =
      targetRowCards.length > 0
        ? getBetweenRank(
            targetRowCards[targetRowCards.length - 1].laneRank,
            undefined,
          )
        : getInitialRank();

    // Update scope, partId, chapterId based on target row
    const updates: Partial<CorkboardCard> = {
      laneRank: newRank,
      scope: targetRowType,
    };

    if (targetRowType === "book") {
      updates.partId = null;
      updates.chapterId = null;
    } else if (targetRowType === "part") {
      updates.partId = targetPartId;
      updates.chapterId = null;
    } else {
      // chapter
      updates.chapterId = targetChapterId;
      // Infer partId from chapter
      const chapter = chapters.find((ch) => ch.id === targetChapterId);
      updates.partId = chapter?.partId || null;
    }

    // Optimistic update
    setCards(cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));

    try {
      await corkboardApi.updateCard(bookId, cardId, updates);
    } catch (error) {
      console.error("Error moving card:", error);
      setCards(originalCards);
      toast.error("Failed to move card");
    }
  };

  const handleCardReorder = async (
    cardId: string,
    targetCardId: string,
    position: "before" | "after",
    targetRowType: "book" | "part" | "chapter",
    targetPartId: string | null,
    targetChapterId: string | null,
  ) => {
    if (!bookId) {
      toast.error("Select a book before reordering cards");
      return;
    }

    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    // Don't reorder if it's the same card
    if (cardId === targetCardId) return;

    const originalCards = [...cards];

    // Check if the card is in the same row as the target
    const cardInSameRow =
      (targetRowType === "book" && card.scope === "book") ||
      (targetRowType === "part" &&
        card.scope === "part" &&
        card.partId === targetPartId) ||
      (targetRowType === "chapter" &&
        card.scope === "chapter" &&
        card.chapterId === targetChapterId);

    // Get all cards in the target row
    let targetRowCards = cards
      .filter((c) => {
        // Use same boardId logic as filteredCards
        const matchesBoard =
          c.boardId === currentBoardId ||
          (!c.boardId && currentBoardId === "main-board");
        if (!matchesBoard) return false;

        if (targetRowType === "book") {
          return c.scope === "book";
        } else if (targetRowType === "part") {
          return c.scope === "part" && c.partId === targetPartId;
        } else {
          return c.scope === "chapter" && c.chapterId === targetChapterId;
        }
      })
      .sort((a, b) => a.laneRank.localeCompare(b.laneRank));

    // Check for invalid rank ordering and rebalance if needed
    let needsRebalance = false;
    for (let i = 0; i < targetRowCards.length - 1; i++) {
      if (targetRowCards[i].laneRank >= targetRowCards[i + 1].laneRank) {
        needsRebalance = true;
        break;
      }
    }

    if (needsRebalance) {
      // Rebalance all ranks in this row
      const rebalancedRanks = rebalanceRanks(targetRowCards.length);
      const updates: Promise<unknown>[] = [];

      for (let i = 0; i < targetRowCards.length; i++) {
        const newRank = rebalancedRanks[i];
        targetRowCards[i] = { ...targetRowCards[i], laneRank: newRank };

        // Queue API update
        updates.push(
          corkboardApi.updateCard(bookId, targetRowCards[i].id, {
            laneRank: newRank,
          }),
        );
      }

      // Wait for all updates
      try {
        await Promise.all(updates);

        // Update state with rebalanced ranks
        setCards((prevCards) =>
          prevCards.map((c) => {
            const rebalanced = targetRowCards.find((rc) => rc.id === c.id);
            return rebalanced ? { ...c, laneRank: rebalanced.laneRank } : c;
          }),
        );

        // Now reload the fresh data for the reorder operation
        targetRowCards = cards
          .map((c) => {
            const rebalanced = targetRowCards.find((rc) => rc.id === c.id);
            return rebalanced ? { ...c, laneRank: rebalanced.laneRank } : c;
          })
          .filter((c) => {
            const matchesBoard =
              c.boardId === currentBoardId ||
              (!c.boardId && currentBoardId === "main-board");
            if (!matchesBoard) return false;

            if (targetRowType === "book") {
              return c.scope === "book";
            } else if (targetRowType === "part") {
              return c.scope === "part" && c.partId === targetPartId;
            } else {
              return c.scope === "chapter" && c.chapterId === targetChapterId;
            }
          })
          .sort((a, b) => a.laneRank.localeCompare(b.laneRank));
      } catch (error) {
        console.error("Error rebalancing ranks:", error);
        toast.error("Failed to rebalance ranks");
        setCards(originalCards);
        return;
      }
    }

    // Find the target card in the sorted list
    const targetIndex = targetRowCards.findIndex((c) => c.id === targetCardId);

    if (targetIndex === -1) {
      // Target card not found - shouldn't happen, but handle gracefully
      console.error("Target card not found in row");
      console.error("Looking for target card:", targetCardId);
      console.error(
        "Target card details:",
        cards.find((c) => c.id === targetCardId),
      );
      return;
    }

    // Calculate new rank based on position
    let newRank: string;

    if (cardInSameRow) {
      // Card is already in this row - reorder it
      // Remove the dragged card from consideration
      const cardsWithoutDragged = targetRowCards.filter((c) => c.id !== cardId);
      const targetIndexWithoutDragged = cardsWithoutDragged.findIndex(
        (c) => c.id === targetCardId,
      );

      if (position === "before") {
        // Insert before target card
        const prevCard =
          targetIndexWithoutDragged > 0
            ? cardsWithoutDragged[targetIndexWithoutDragged - 1]
            : null;
        const nextCard = cardsWithoutDragged[targetIndexWithoutDragged];
        newRank = getBetweenRank(prevCard?.laneRank, nextCard.laneRank);
      } else {
        // Insert after target card (default behavior)
        const prevCard = cardsWithoutDragged[targetIndexWithoutDragged];
        const nextCard =
          targetIndexWithoutDragged < cardsWithoutDragged.length - 1
            ? cardsWithoutDragged[targetIndexWithoutDragged + 1]
            : null;
        newRank = getBetweenRank(prevCard.laneRank, nextCard?.laneRank);
      }
    } else {
      // Card is moving from a different row - position it relative to target
      if (position === "before") {
        // Insert before target card
        const prevCard =
          targetIndex > 0 ? targetRowCards[targetIndex - 1] : null;
        const nextCard = targetRowCards[targetIndex];
        newRank = getBetweenRank(prevCard?.laneRank, nextCard.laneRank);
      } else {
        // Insert after target card (default behavior)
        const prevCard = targetRowCards[targetIndex];
        const nextCard =
          targetIndex < targetRowCards.length - 1
            ? targetRowCards[targetIndex + 1]
            : null;
        newRank = getBetweenRank(prevCard.laneRank, nextCard?.laneRank);
      }
    }

    // Update scope, partId, chapterId based on target row
    const updates: Partial<CorkboardCard> = {
      laneRank: newRank,
      scope: targetRowType,
    };

    if (targetRowType === "book") {
      updates.partId = null;
      updates.chapterId = null;
    } else if (targetRowType === "part") {
      updates.partId = targetPartId;
      updates.chapterId = null;
    } else {
      // chapter
      updates.chapterId = targetChapterId;
      // Infer partId from chapter
      const chapter = chapters.find((ch) => ch.id === targetChapterId);
      updates.partId = chapter?.partId || null;
    }

    // Optimistic update
    setCards(cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));

    try {
      await corkboardApi.updateCard(bookId, cardId, updates);
    } catch (error) {
      console.error("Error reordering card:", error);
      setCards(originalCards);
      toast.error("Failed to reorder card");
    }
  };

  // Filter cards by current board
  const filteredCards = cards.filter(
    (c) => c.boardId === currentBoardId || (!c.boardId && boards.length <= 1),
  );

  // Get cards for a specific row
  const getCardsForRow = (row: CorkboardRowType): CorkboardCard[] => {
    return filteredCards
      .filter((card) => {
        if (row.type === "book") {
          return card.scope === "book";
        } else if (row.type === "part") {
          return card.scope === "part" && card.partId === row.partId;
        } else {
          return card.scope === "chapter" && card.chapterId === row.chapterId;
        }
      })
      .sort((a, b) => a.laneRank.localeCompare(b.laneRank));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading corkboard...</div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <CorkboardContent
        chapters={chapters}
        parts={parts}
        bookTitle={bookTitle}
        cards={cards}
        boards={boards}
        currentBoardId={currentBoardId}
        searchQuery={searchQuery || ""}
        displayMode={displayMode || "cards"}
        leftOpen={leftSidebarOpen}
        selection={effectiveSelection}
        visibleRows={visibleRows}
        filteredCards={filteredCards}
        setLeftOpen={setLeftSidebarOpen || (() => {})}
        setSearchQuery={onSearchQueryChange || (() => {})}
        setDisplayMode={onDisplayModeChange || (() => {})}
        handleSelectManuscript={handleSelectManuscript}
        handleSelectPart={handleSelectPart}
        handleSelectChapter={handleSelectChapter}
        handleReorderChapters={handleReorderChapters}
        handleReorder={handleReorder}
        handleCreateCard={handleCreateCard}
        handleOpenCardInspector={handleOpenCardInspector}
        handleOpenChapterInspector={handleOpenChapterInspector}
        handleDeleteCard={handleDeleteCard}
        handleCardDrop={handleCardDrop}
        handleCardReorder={handleCardReorder}
        getCardsForRow={getCardsForRow}
        addChapter={addChapter}
        deleteChapter={deleteChapter}
        updateChapterTitle={updateChapterTitle}
        updateChapterDetails={updateChapterDetails}
        addPart={addPart}
        deletePart={deletePart}
        updatePartTitle={updatePartTitle}
        reorderParts={reorderParts}
        // NEW: UI Cohesion - Lifted state for Context Bar controls
        leftSidebarOpen={leftSidebarOpen}
        setSelectionLabel={setSelectionLabel}
      />
    </DndProvider>
  );
}

// Separate component to use useDragLayer hook
function CorkboardContent({
  chapters,
  parts,
  bookTitle,
  cards,
  boards,
  currentBoardId,
  searchQuery,
  displayMode,
  leftOpen,
  selection,
  visibleRows,
  filteredCards,
  setLeftOpen,
  setSearchQuery,
  setDisplayMode,
  handleSelectManuscript,
  handleSelectPart,
  handleSelectChapter,
  handleReorderChapters,
  handleReorder,
  handleCreateCard,
  handleOpenCardInspector,
  handleOpenChapterInspector,
  handleDeleteCard,
  handleCardDrop,
  handleCardReorder,
  getCardsForRow,
  addChapter,
  deleteChapter,
  updateChapterTitle,
  updateChapterDetails,
  addPart,
  deletePart,
  updatePartTitle,
  reorderParts,
  // NEW: UI Cohesion - Lifted state for Context Bar controls
  leftSidebarOpen,
  setSelectionLabel,
}: {
  chapters: Chapter[];
  parts: Part[];
  bookTitle?: string;
  cards: CorkboardCard[];
  boards: CorkboardBoard[];
  currentBoardId: string | null;
  searchQuery: string;
  displayMode: CorkboardDisplayMode;
  leftOpen: boolean;
  selection: ManuscriptSelection;
  visibleRows: CorkboardRowType[];
  filteredCards: CorkboardCard[];
  setLeftOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setDisplayMode: (mode: CorkboardDisplayMode) => void;
  handleSelectManuscript: () => void;
  handleSelectPart: (partId: string) => void;
  handleSelectChapter: (chapterId: string) => void;
  handleReorderChapters: (orderedIds: string[]) => void;
  handleReorder: (chapters: Chapter[]) => void;
  handleCreateCard: (
    scope: "book" | "part" | "chapter",
    partId: string | null,
    chapterId: string | null,
  ) => void;
  handleOpenCardInspector: (card: CorkboardCard) => void;
  handleOpenChapterInspector: (chapter: Chapter) => void;
  handleDeleteCard: (cardId: string) => void;
  handleCardDrop: (
    cardId: string,
    targetRowType: "book" | "part" | "chapter",
    targetPartId: string | null,
    targetChapterId: string | null,
  ) => void;
  handleCardReorder: (
    cardId: string,
    targetCardId: string,
    position: "before" | "after",
    targetRowType: "book" | "part" | "chapter",
    targetPartId: string | null,
    targetChapterId: string | null,
  ) => void;
  getCardsForRow: (row: CorkboardRowType) => CorkboardCard[];
  addChapter?: (title?: string) => Promise<string>;
  deleteChapter?: (id: string) => void;
  updateChapterTitle?: (id: string, title: string) => void;
  updateChapterDetails?: (id: string, updates: Partial<Chapter>) => void;
  addPart?: (data: { title: string; notes?: string }) => Promise<Part>;
  deletePart?: (id: string) => void;
  updatePartTitle?: (id: string, name: string) => void;
  reorderParts?: (parts: Part[]) => void;
  // NEW: UI Cohesion - Lifted state for Context Bar controls
  leftSidebarOpen: boolean;
  setSelectionLabel?: (label: string) => void;
}) {
  // Track if any card is being dragged
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging() && monitor.getItemType() === "CARD",
  }));

  return (
    <div className="h-full flex-1 overflow-auto bg-gray-50">
      {visibleRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-gray-400 mb-4">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg mb-2">No rows to display</h3>
            <p className="text-sm">
              Create chapters or parts to organize your cards
            </p>
          </div>
        </div>
      ) : (displayMode || "cards") === "list" ? (
        <div className="px-6 py-6">
          <CorkboardListView
            rows={visibleRows}
            getCardsForRow={getCardsForRow}
            searchQuery={searchQuery || ""}
            onCardClick={handleOpenCardInspector}
            onCardDrop={handleCardDrop}
            onCardReorder={handleCardReorder}
            onAddCard={handleCreateCard}
            chapters={chapters}
            cardTags={new Map()} // TODO: Load tags for list view
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-6 py-6">
          {visibleRows.map((row, index) => {
            const rowCards = getCardsForRow(row);

            // Add part header before first chapter of a part in Full Manuscript view
            const shouldShowPartHeader =
              selection.kind === "manuscript" && row.type === "part";

            return (
              <div key={`${row.type}-${index}`}>
                {shouldShowPartHeader && (
                  <div className="mb-4 pb-3 border-b-2 border-gray-300">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-gray-600" />
                      <h2 className="text-lg font-semibold text-gray-800">
                        {row.type === "part" ? row.partTitle : ""}
                      </h2>
                    </div>
                  </div>
                )}

                <CorkboardRow
                  row={row}
                  cards={rowCards}
                  displayMode={displayMode || "cards"}
                  searchQuery={searchQuery || ""}
                  bookTitle={bookTitle}
                  parts={parts}
                  onCardClick={handleOpenCardInspector}
                  onCardDelete={handleDeleteCard}
                  onCardDrop={handleCardDrop}
                  onCardReorder={handleCardReorder}
                  onAddCard={handleCreateCard}
                  isDraggingAny={isDragging}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
