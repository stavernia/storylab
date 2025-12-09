import { Info, Target, BarChart3, MessageSquareMore, Clock3 } from 'lucide-react';
import { useInspector, type InspectorTool } from '@/contexts/InspectorContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ToolRail() {
  const { activeTool, isOpen, setInspectorTool, openInspector, closeInspector } = useInspector();

  const tools: { id: InspectorTool; icon: typeof Info; label: string }[] = [
    { id: 'inspector', icon: Info, label: 'Inspector' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'comments', icon: MessageSquareMore, label: 'Comments' },
    { id: 'history', icon: Clock3, label: 'History' },
  ];
  
  const handleToolClick = (tool: InspectorTool) => {
    if (activeTool === tool && isOpen) {
      // Clicking the active tool closes the inspector
      closeInspector();
    } else {
      // Clicking a different tool (or same tool when closed) opens/switches inspector
      // IMPORTANT: Clear old content payload when switching to a new tool
      setInspectorTool(tool);
      openInspector({}, tool); // Pass empty payload to clear old content
    }
  };

  return (
    <div data-tour-id="utilityRail" className="w-14 h-full flex flex-col items-center justify-start gap-1.5 py-3 border-l border-slate-200 bg-slate-50 flex-shrink-0">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id && isOpen;
        
        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleToolClick(tool.id)}
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60818E] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 ${
                  isActive
                    ? 'bg-[#60818E] text-white shadow-lg shadow-[#60818E]/30'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
                aria-label={tool.label}
              >
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7d9ca8] rounded-l-full" />
                )}
                <Icon className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}