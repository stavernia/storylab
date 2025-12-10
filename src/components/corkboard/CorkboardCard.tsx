import React from 'react';
import { useDrag } from 'react-dnd';
import { CorkboardCard as CardType } from "@/api/corkboard";
import { Tag } from '@/services/tag';
import { TagBadges } from '@/components/tags/TagBadges';
import { Trash2 } from 'lucide-react';

interface CorkboardCardProps {
  card: CardType;
  onClick: () => void;
  onDelete: () => void;
  isSearchMatch: boolean;
  compact: boolean;
  tags?: Tag[];
  dimmed?: boolean;
}

const colorClasses = {
  blue: 'border-l-blue-500 bg-blue-50/50',
  amber: 'border-l-amber-500 bg-amber-50/50',
  gray: 'border-l-gray-500 bg-gray-50/50',
  green: 'border-l-green-500 bg-green-50/50',
  purple: 'border-l-purple-500 bg-purple-50/50',
  red: 'border-l-red-500 bg-red-50/50',
};

const statusConfig = {
  idea: { label: 'Idea', color: 'bg-gray-400' },
  draft: { label: 'Draft', color: 'bg-amber-400' },
  done: { label: 'Done', color: 'bg-green-400' },
};

export function CorkboardCard({ card, onClick, onDelete, isSearchMatch, compact, tags, dimmed }: CorkboardCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'CARD',
    item: { id: card.id, chapterId: card.chapterId, laneRank: card.laneRank },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onClick();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (confirm(`Delete "${card.title}"?`)) {
        onDelete();
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (confirm(`Delete "${card.title}"?`)) {
      onDelete();
    }
  };

  const colorClass = card.color
    ? colorClasses[card.color as keyof typeof colorClasses] ?? 'border-l-gray-300 bg-white'
    : 'border-l-gray-300 bg-white';
  const statusInfo = card.status
    ? statusConfig[card.status as keyof typeof statusConfig] ?? null
    : null;

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`
        relative group
        border-l-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${colorClass}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${!isSearchMatch ? 'opacity-30' : ''}
        ${compact ? 'p-3' : 'p-4'}
        ${dimmed ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="flex-1 truncate">{card.title}</h3>
        {statusInfo && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
            <span>{statusInfo.label}</span>
          </div>
        )}
      </div>
      
      {card.summary && (
        <p className={`text-sm text-gray-600 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
          {card.summary}
        </p>
      )}
      
      {card.wordEstimate && (
        <div className="mt-2 text-xs text-gray-500">
          ~{card.wordEstimate} words
        </div>
      )}
      
      {tags && tags.length > 0 && (
        <div className="mt-2">
          <TagBadges tags={tags} />
        </div>
      )}
      
      {/* Delete button - appears on hover */}
      <button
        className="absolute top-2 right-2 p-1 rounded-md bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDeleteClick}
        aria-label="Delete card"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
