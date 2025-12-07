import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SideTabProps {
  side: 'left' | 'right';
  isOpen: boolean;
  onClick: () => void;
  label: string;
}

/**
 * PHASE 6A: Global Polish - Refined vertical tab for collapsing/expanding sidebars
 * Consistent styling with app/tool rail buttons: rounded, hover states, centered positioning
 */
export function SideTab({ side, isOpen, onClick, label }: SideTabProps) {
  const isLeft = side === 'left';
  
  return (
    <button
      onClick={onClick}
      className={`
        absolute top-1/2 -translate-y-1/2 z-20
        w-5 h-16
        rounded-lg
        bg-white border border-gray-200
        hover:bg-gray-50 hover:border-gray-300
        flex items-center justify-center
        cursor-pointer
        shadow-sm hover:shadow
        ${isLeft ? 'left-0' : 'right-0'}
      `}
      aria-label={label}
      title={label}
    >
      {isLeft ? (
        isOpen ? <ChevronLeft className="w-3.5 h-3.5 text-gray-600" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
      ) : (
        isOpen ? <ChevronRight className="w-3.5 h-3.5 text-gray-600" /> : <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
      )}
    </button>
  );
}