import { X } from 'lucide-react';
import { useToolPanel } from '@/contexts/ToolPanelContext';
import { GoalsPanel } from '@/components/tools/GoalsPanel';
import { AnalyticsPanel } from '@/components/tools/AnalyticsPanel';
import { CommentsPanel } from '@/components/tools/CommentsPanel';
import { HistoryPanel } from '@/components/tools/HistoryPanel';

export function ToolPanelContainer() {
  const { activeTool, closeTool } = useToolPanel();

  if (!activeTool) return null;

  // Map tool to title and content (inspector removed - now standalone)
  const toolConfig: Record<string, { title: string; content: React.ReactNode }> = {
    goals: { title: 'Goals', content: <GoalsPanel /> },
    analytics: { title: 'Analytics', content: <AnalyticsPanel /> },
    comments: { title: 'Comments', content: <CommentsPanel /> },
    history: { title: 'History', content: <HistoryPanel /> },
  };

  const config = toolConfig[activeTool];
  if (!config) return null;

  return (
    <div 
      className="h-full w-96 bg-white border-l border-slate-200 shadow-lg flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-200"
    >
      {/* Panel header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h2 className="text-sm font-medium text-slate-900">{config.title}</h2>
        <button
          type="button"
          onClick={closeTool}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {config.content}
      </div>
    </div>
  );
}