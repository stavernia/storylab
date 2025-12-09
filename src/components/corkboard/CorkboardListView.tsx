import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { BookOpen, FolderOpen, FileText, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { CorkboardCard as CardType } from "@/api/corkboard";
import { Tag } from '@/services/tag';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useChapterNumbering } from '@/contexts/ChapterNumberingContext';

type CorkboardRowType = 
  | { type: 'book' }
  | { type: 'part'; partId: string; partTitle: string }
  | { type: 'chapter'; chapterId: string; chapterTitle: string; partId?: string | null };

interface CorkboardListViewProps {
  rows: CorkboardRowType[];
  getCardsForRow: (row: CorkboardRowType) => CardType[];
  searchQuery: string;
  onCardClick: (card: CardType) => void;
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
  chapters: Array<{ id: string; title: string }>;
  cardTags: Map<string, Tag[]>;
}

interface ListCardRowProps {
  card: CardType;
  onClick: () => void;
  onDrop: (cardId: string, position: 'before' | 'after') => void;
  isDragging: boolean;
  chapters: Array<{ id: string; title: string }>;
  tags: Tag[];
}

function ListCardRow({ card, onClick, onDrop, isDragging, chapters, tags }: ListCardRowProps) {
  const [{ isDragging: isDraggingThis }, drag, preview] = useDrag({
    type: 'CARD',
    item: { id: card.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOverBefore }, dropBefore] = useDrop({
    accept: 'CARD',
    drop: (item: { id: string }) => {
      if (item.id !== card.id) {
        onDrop(item.id, 'before');
      }
    },
    collect: (monitor) => ({
      isOverBefore: monitor.isOver(),
    }),
  });

  const [{ isOverAfter }, dropAfter] = useDrop({
    accept: 'CARD',
    drop: (item: { id: string }) => {
      if (item.id !== card.id) {
        onDrop(item.id, 'after');
      }
    },
    collect: (monitor) => ({
      isOverAfter: monitor.isOver(),
    }),
  });

  const statusLabels = {
    idea: 'Idea',
    draft: 'Draft',
    done: 'Done',
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
  };

  const getScopeLabel = () => {
    if (!card.scope || card.scope === 'chapter') return 'Chapter';
    return card.scope.charAt(0).toUpperCase() + card.scope.slice(1);
  };

  const getChapterTitle = () => {
    if (!card.chapterId) return '—';
    const chapter = chapters.find(ch => ch.id === card.chapterId);
    return chapter ? chapter.title : '—';
  };

  return (
    <div className="relative">
      {/* Drop indicator before */}
      {isDragging && isOverBefore && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-purple-500 rounded-full z-10" />
      )}
      
      <div
        ref={preview}
        className={`
          grid grid-cols-[auto_minmax(200px,1fr)_100px_150px_80px_100px_120px_200px] gap-4 items-center
          px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors h-[52px]
          ${isDraggingThis ? 'opacity-40' : 'opacity-100'}
        `}
        onClick={onClick}
      >
        {/* Drag Handle */}
        <div ref={drag} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Title */}
        <div className="font-medium text-sm text-gray-900 truncate">
          {card.title || 'Untitled'}
        </div>

        {/* Scope */}
        <div className="text-xs text-gray-600">
          {getScopeLabel()}
        </div>

        {/* Chapter */}
        <div className="text-xs text-gray-600 truncate">
          {getChapterTitle()}
        </div>

        {/* Status */}
        <div className="text-xs">
          {card.status ? (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {statusLabels[card.status]}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>

        {/* Color */}
        <div className="text-xs">
          {card.color ? (
            <span className={`px-2 py-0.5 rounded-full text-xs ${colorClasses[card.color]}`}>
              {card.color}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>

        {/* Word Estimate */}
        <div className="text-xs text-gray-600">
          {card.wordEstimate ? `~${card.wordEstimate}` : '—'}
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap">
          {tags.length > 0 ? (
            tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-700"
              >
                {tag.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
          {tags.length > 3 && (
            <span className="text-xs text-gray-500">+{tags.length - 3}</span>
          )}
        </div>
      </div>

      {/* Drop indicator after */}
      {isDragging && isOverAfter && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-purple-500 rounded-full z-10" />
      )}
    </div>
  );
}

interface SectionProps {
  row: CorkboardRowType;
  cards: CardType[];
  searchQuery: string;
  onCardClick: (card: CardType) => void;
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
  chapters: Array<{ id: string; title: string }>;
  cardTags: Map<string, Tag[]>;
  isDragging: boolean;
}

function Section({
  row,
  cards,
  searchQuery,
  onCardClick,
  onCardReorder,
  onAddCard,
  chapters,
  cardTags,
  isDragging,
}: SectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { getChapterNumber } = useChapterNumbering();

  const getHeader = () => {
    if (row.type === 'book') {
      return {
        icon: <BookOpen className="w-4 h-4 text-blue-600" />,
        title: 'Book',
        bgClass: 'bg-blue-50',
      };
    } else if (row.type === 'part') {
      return {
        icon: <FolderOpen className="w-4 h-4 text-purple-600" />,
        title: row.partTitle,
        bgClass: 'bg-purple-50',
      };
    } else {
      const chapterNumber = getChapterNumber(row.chapterId);
      return {
        icon: <FileText className="w-4 h-4 text-green-600" />,
        title: `Chapter ${chapterNumber} • ${row.chapterTitle || 'Untitled'}`,
        bgClass: 'bg-gray-50',
      };
    }
  };

  const header = getHeader();

  // Filter cards
  const filteredCards = cards.filter(card => 
    !searchQuery || 
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (card.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // Sort by laneRank
  const sortedCards = [...filteredCards].sort((a, b) => a.laneRank.localeCompare(b.laneRank));

  const handleDrop = (draggedCardId: string, targetCardId: string, position: 'before' | 'after') => {
    onCardReorder(
      draggedCardId,
      targetCardId,
      position,
      row.type,
      row.type === 'part' ? row.partId : (row.type === 'chapter' ? row.partId || null : null),
      row.type === 'chapter' ? row.chapterId : null
    );
  };

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
    <div className="border-b border-gray-200">
      {/* Section Header */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-4 py-2 ${header.bgClass} border-b border-gray-200`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
          {header.icon}
          <span className="text-sm font-medium text-gray-900">{header.title}</span>
          <span className="text-xs text-gray-500 ml-2">
            ({sortedCards.length} {sortedCards.length === 1 ? 'card' : 'cards'})
          </span>
        </button>
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

      {/* Section Content */}
      {!isCollapsed && (
        <div>
          {sortedCards.length > 0 ? (
            sortedCards.map((card) => (
              <ListCardRow
                key={card.id}
                card={card}
                onClick={() => onCardClick(card)}
                onDrop={(draggedCardId, position) => handleDrop(draggedCardId, card.id, position)}
                isDragging={isDragging}
                chapters={chapters}
                tags={cardTags.get(card.id) || []}
              />
            ))
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              No cards in this section
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CorkboardListView({
  rows,
  getCardsForRow,
  searchQuery,
  onCardClick,
  onCardDrop,
  onCardReorder,
  onAddCard,
  chapters,
  cardTags,
}: CorkboardListViewProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[auto_minmax(200px,1fr)_100px_150px_80px_100px_120px_200px] gap-4 items-center px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 uppercase tracking-wider sticky top-0 z-30">
        <div></div> {/* Drag handle column */}
        <div>Title</div>
        <div>Scope</div>
        <div>Chapter</div>
        <div>Status</div>
        <div>Color</div>
        <div>Words</div>
        <div>Tags</div>
      </div>

      {/* Sections */}
      {rows.map((row, index) => (
        <Section
          key={`${row.type}-${index}`}
          row={row}
          cards={getCardsForRow(row)}
          searchQuery={searchQuery}
          onCardClick={onCardClick}
          onCardReorder={onCardReorder}
          onAddCard={onAddCard}
          chapters={chapters}
          cardTags={cardTags}
          isDragging={isDragging}
        />
      ))}
    </div>
  );
}
