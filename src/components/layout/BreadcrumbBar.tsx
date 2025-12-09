import { ChevronRight } from 'lucide-react';
import { APP_VIEWS, type AppViewId } from '@/config/views';

interface BreadcrumbBarProps {
  viewId: AppViewId;
  viewLabel?: string;
  selectionLabel?: string;
  bookTitle?: string; // NEW: Multi-book support
}

export function BreadcrumbBar({ viewId, viewLabel, selectionLabel, bookTitle }: BreadcrumbBarProps) {
  // Resolve view label from registry if not provided
  const viewDef = APP_VIEWS.find(v => v.id === viewId);
  const displayViewLabel = viewLabel || viewDef?.label || 'View';
  const displayBookTitle = bookTitle || 'Current Book';

  return (
    <div className="h-8 flex items-center gap-1 px-3 text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
      <span className="text-slate-600">{displayBookTitle}</span>
      <ChevronRight className="w-3 h-3" />
      <span className="text-slate-700">{displayViewLabel}</span>
      {selectionLabel && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700">{selectionLabel}</span>
        </>
      )}
    </div>
  );
}