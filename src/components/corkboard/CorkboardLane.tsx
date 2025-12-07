import { useDrop } from 'react-dnd';
import { CorkboardCard as CardType } from "../../api/corkboard";
import { CorkboardCard } from './CorkboardCard';
import { useEntityTags } from '../../hooks/useEntityTags';
import { useTagFilter } from '../../contexts/TagFilterContext';

interface CorkboardLaneProps {
  laneId: string;
  title: string;
  cards: CardType[];
  onCardClick: (card: CardType) => void;
  onCardDelete: (cardId: string) => void;
  onCardDrop: (cardId: string, targetLaneId: string, targetRank: string) => void;
  searchQuery: string;
  compact: boolean;
}

export function CorkboardLane({
  laneId,
  title,
  cards,
  onCardClick,
  onCardDelete,
  onCardDrop,
  searchQuery,
  compact,
}: CorkboardLaneProps) {
  const { matches, mode, isActive } = useTagFilter();
  
  const [{ isOver }, drop] = useDrop({
    accept: 'CARD',
    drop: (item: { id: string; chapterId?: string; laneRank: string }, monitor) => {
      if (!monitor.didDrop()) {
        // Calculate the new rank for the dropped card
        const targetRank = cards.length > 0 
          ? cards[cards.length - 1].laneRank + 'z' // Simple append for now
          : 'U'; // Initial rank
        onCardDrop(item.id, laneId, targetRank);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  // Filter cards based on search
  const filteredCards = cards.map(card => ({
    card,
    isMatch: !searchQuery || 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  }));

  const matchCount = filteredCards.filter(c => c.isMatch).length;

  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[320px]">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h2 className="truncate">{title}</h2>
        <span className="text-sm text-gray-500">
          {searchQuery ? `${matchCount}/` : ''}{cards.length}
        </span>
      </div>
      
      <div
        ref={drop}
        className={`
          flex-1 overflow-y-auto p-4 space-y-3
          ${isOver ? 'bg-blue-50' : 'bg-gray-50/50'}
          transition-colors
        `}
      >
        {filteredCards.map(({ card, isMatch }) => (
          <CardWithTags
            key={card.id}
            card={card}
            isMatch={isMatch}
            compact={compact}
            onClick={() => onCardClick(card)}
            onDelete={() => onCardDelete(card.id)}
            matches={matches}
            mode={mode}
            isActive={isActive}
          />
        ))}
        
        {cards.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No cards yet
          </div>
        )}
        
        {searchQuery && matchCount === 0 && cards.length > 0 && (
          <div className="text-center text-gray-400 py-8">
            No matching cards
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component to handle tag loading for each card
function CardWithTags({ 
  card, 
  isMatch, 
  compact, 
  onClick, 
  onDelete,
  matches,
  mode,
  isActive
}: {
  card: CardType;
  isMatch: boolean;
  compact: boolean;
  onClick: () => void;
  onDelete: () => void;
  matches: (tags: any[]) => boolean;
  mode: 'dim' | 'hide';
  isActive: boolean;
}) {
  const { tags } = useEntityTags('card', card.id);
  const visible = !isActive || (tags && matches(tags));
  const dimmed = isActive && !visible && mode === 'dim';
  const hidden = isActive && !visible && mode === 'hide';

  if (hidden) return null;

  return (
    <CorkboardCard
      card={card}
      onClick={onClick}
      onDelete={onDelete}
      isSearchMatch={isMatch}
      compact={compact}
      tags={tags}
      dimmed={dimmed}
    />
  );
}
