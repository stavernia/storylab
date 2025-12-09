import { useState } from 'react';
import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, BookOpen, FolderOpen, FileText, GripVertical } from 'lucide-react';
import { CorkboardCard as CardType } from "@/api/corkboard";
import { CorkboardCard } from './CorkboardCard';
import { Button } from '@/components/ui/button';
import { useChapterNumbering } from '@/contexts/ChapterNumberingContext';
import type { Part } from '@/App';

type CorkboardRowType = 
  | { type: 'book' }
  | { type: 'part'; partId: string; partTitle: string }
  | { type: 'chapter'; chapterId: string; chapterTitle: string; partId?: string | null };

interface CorkboardRowProps {
  row: CorkboardRowType;
  cards: CardType[];
  displayMode: 'cards' | 'list';
  searchQuery: string;
  bookTitle?: string; // Add book title prop
  parts?: Part[]; // Add parts prop to get part numbers
  onCardClick: (card: CardType) => void;
  onCardDelete: (cardId: string) => void;
  onCardDrop: (
    cardId: string,
    targetRowType: 'book' | 'part' | 'chapter',
    targetPartId: string | null,
    targetChapterId: string | null
  ) => void;
  onCardReorder: (
    cardId: string,
    targetCardId: string,
    position: 'before' | 'after',
    targetRowType: 'book' | 'part' | 'chapter',
    targetPartId: string | null,
    targetChapterId: string | null
  ) => void;
  onAddCard: (
    scope: 'book' | 'part' | 'chapter',
    partId: string | null,
    chapterId: string | null
  ) => void;
  isDraggingAny: boolean;
}

export function CorkboardRow({
  row,
  cards,
  displayMode,
  searchQuery,
  bookTitle, // Add book title
  parts, // Add parts
  onCardClick,
  onCardDelete,
  onCardDrop,
  onCardReorder,
  onAddCard,
  isDraggingAny,
}: CorkboardRowProps) {
  const [dropPosition, setDropPosition] = useState<{ index: number } | null>(null);
  const { getChapterNumber, getPartNumber } = useChapterNumbering();

  // Setup drop target for the entire row
  const [{ isOver }, drop] = useDrop({
    accept: 'CARD',
    hover: (item: { id: string }, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Find which card we're hovering over
      const hoverIndex = getDropIndex(clientOffset.x);
      setDropPosition({ index: hoverIndex });
    },
    drop: (item: { id: string }, monitor) => {
      if (!monitor.didDrop() && dropPosition !== null) {
        handleDrop(item.id, dropPosition.index);
      }
      setDropPosition(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  const handleDrop = (draggedCardId: string, index: number) => {
    if (sortedCards.length === 0) {
      // Empty row - just change scope
      if (row.type === 'book') {
        onCardDrop(draggedCardId, 'book', null, null);
      } else if (row.type === 'part') {
        onCardDrop(draggedCardId, 'part', row.partId, null);
      } else {
        onCardDrop(draggedCardId, 'chapter', row.partId || null, row.chapterId);
      }
    } else if (index === 0) {
      // Drop before first card
      const targetCard = sortedCards[0];
      onCardReorder(
        draggedCardId,
        targetCard.id,
        'before',
        row.type,
        row.type === 'part' ? row.partId : (row.type === 'chapter' ? row.partId || null : null),
        row.type === 'chapter' ? row.chapterId : null
      );
    } else if (index > sortedCards.length) {
      // Drop after last card
      const targetCard = sortedCards[sortedCards.length - 1];
      onCardReorder(
        draggedCardId,
        targetCard.id,
        'after',
        row.type,
        row.type === 'part' ? row.partId : (row.type === 'chapter' ? row.partId || null : null),
        row.type === 'chapter' ? row.chapterId : null
      );
    } else {
      // Drop between cards
      const targetCard = sortedCards[index - 1];
      onCardReorder(
        draggedCardId,
        targetCard.id,
        'after',
        row.type,
        row.type === 'part' ? row.partId : (row.type === 'chapter' ? row.partId || null : null),
        row.type === 'chapter' ? row.chapterId : null
      );
    }
  };

  const getDropIndex = (clientX: number): number => {
    const cards = document.querySelectorAll(`[data-row-id="${getRowId()}"] [data-card-id]`);
    let bestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(clientX - cardCenterX);

      if (distance < minDistance) {
        minDistance = distance;
        bestIndex = clientX < cardCenterX ? index : index + 1;
      }
    });

    if (cards.length === 0) {
      return 0;
    }

    return bestIndex;
  };

  const getRowId = () => {
    if (row.type === 'book') return 'book';
    if (row.type === 'part') return `part-${row.partId}`;
    return `chapter-${row.chapterId}`;
  };

  // Filter cards based on search
  const filteredCards = cards.filter(card => 
    !searchQuery || 
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (card.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // Sort all cards by laneRank
  const sortedCards = [...cards].sort((a, b) => a.laneRank.localeCompare(b.laneRank));

  // Get row header
  const getRowHeader = () => {
    if (row.type === 'book') {
      return {
        icon: <BookOpen className="w-4 h-4 text-blue-600" />,
        subtitle: 'Full Manuscript',
        title: bookTitle || 'Book',
        bgClass: 'bg-blue-50/50',
      };
    } else if (row.type === 'part') {
      const partNumber = getPartNumber(row.partId);
      return {
        icon: <FolderOpen className="w-4 h-4 text-purple-600" />,
        subtitle: `Part ${partNumber}`,
        title: row.partTitle,
        bgClass: 'bg-purple-50/50',
      };
    } else {
      const chapterNumber = getChapterNumber(row.chapterId);
      return {
        icon: <FileText className="w-4 h-4 text-green-600" />,
        subtitle: `Chapter ${chapterNumber}`,
        title: row.chapterTitle || 'Untitled Chapter',
        bgClass: 'bg-gray-50',
      };
    }
  };

  const header = getRowHeader();

  const handleAddCard = () => {
    if (row.type === 'book') {
      onAddCard('book', null, null);
    } else if (row.type === 'part') {
      onAddCard('part', row.partId, null);
    } else {
      onAddCard('chapter', row.partId || null, row.chapterId);
    }
  };

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      data-row-id={getRowId()}
      className={`
        border border-gray-200 rounded-lg bg-white transition-colors
        ${isOver && isDraggingAny ? 'ring-2 ring-purple-300 ring-offset-1' : ''}
      `}
    >
      {/* Row Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${header.bgClass} rounded-t-lg`}>
        <div className="flex items-center gap-2">
          {header.icon}
          <div>
            <p className="text-xs text-gray-500">{header.subtitle}</p>
            <h3 className="text-sm font-medium text-gray-900">{header.title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddCard}
            className="h-7 text-xs px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Card
          </Button>
        </div>
      </div>

      {/* Row Content */}
      <div className="p-4">
        {filteredCards.length > 0 ? (
          <div className="flex flex-wrap gap-3 items-start relative">
            {/* Drop indicator */}
            {isDraggingAny && dropPosition !== null && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-purple-500 rounded-full transition-all z-10"
                style={{
                  left: `${dropPosition.index * (256 + 12) - 6}px`, // 256px card + 12px gap
                }}
              />
            )}
            
            {sortedCards.map((card) => (
              <div
                key={card.id}
                data-card-id={card.id}
                className="w-64 flex-shrink-0"
              >
                <CorkboardCard
                  card={card}
                  onClick={() => onCardClick(card)}
                  onDelete={() => onCardDelete(card.id)}
                  isSearchMatch={!searchQuery || 
                    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (card.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
                  }
                  compact={false}
                  tags={[]}
                  dimmed={false}
                />
              </div>
            ))}

            {/* New Card Placeholder */}
            <button
              onClick={handleAddCard}
              className="w-64 h-32 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <div className="text-center">
                <Plus className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Add Card</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-3">No cards yet</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCard}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Card
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
