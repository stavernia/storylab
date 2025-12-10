import { useInspector } from "@/contexts/InspectorContext";
import { useChapterNumbering } from "@/contexts/ChapterNumberingContext";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Target,
  BarChart3,
  MessageSquareMore,
  Clock3,
  Trash2,
} from "lucide-react";
import {
  InspectorDetails,
  GoalsPanel,
  AnalyticsPanel,
  CommentsPanel,
  HistoryPanel,
} from "@/components/inspector/InspectorContent";

export function InspectorSidebar() {
  const { isOpen, activeTool, payload, openInspector, closeInspector } =
    useInspector();
  const { getChapterNumber, getPartNumber } = useChapterNumbering();
  // Use more specific types for data fields
  const data = payload?.data || {};

  // Get icon and label for current tool
  const getToolConfig = () => {
    // BACKWARD COMPATIBILITY: If payload has custom title/icon/subtitle (for EditorProjectInfoPanel, etc.), use that
    if (payload?.title) {
      return {
        icon: payload.icon || <Info className="w-4 h-4" />,
        label: payload.title,
        subtitle: payload.subtitle,
      };
    }

    // Otherwise use tool defaults based on activeTool and payload
    switch (activeTool) {
      case "inspector":
        // If we have chapter data, show chapter number above chapter title
        if (
          payload?.type === "chapter" &&
          typeof data.chapter === "object" &&
          data.chapter &&
          "id" in data.chapter &&
          "title" in data.chapter
        ) {
          const chapter = data.chapter as { id: string; title?: string };
          const chapterNumber = getChapterNumber(chapter.id);
          return {
            icon: <Info className="w-4 h-4" />,
            label: `Chapter ${chapterNumber}`,
            subtitle: chapter.title,
          };
        }
        // If we have part data, show part number above part title
        if (
          payload?.type === "part" &&
          typeof data.part === "object" &&
          data.part &&
          "id" in data.part &&
          "title" in data.part
        ) {
          const part = data.part as { id: string; title?: string };
          const partNumber = getPartNumber(part.id);
          return {
            icon: <Info className="w-4 h-4" />,
            label: `Part ${partNumber}`,
            subtitle: part.title,
          };
        }
        return { icon: <Info className="w-4 h-4" />, label: "Inspector" };
      case "goals":
        return { icon: <Target className="w-4 h-4" />, label: "Goals" };
      case "analytics":
        return { icon: <BarChart3 className="w-4 h-4" />, label: "Analytics" };
      case "comments":
        return {
          icon: <MessageSquareMore className="w-4 h-4" />,
          label: "Comments",
        };
      case "history":
        return { icon: <Clock3 className="w-4 h-4" />, label: "History" };
      default:
        return { icon: <Info className="w-4 h-4" />, label: "Inspector" };
    }
  };

  const toolConfig = getToolConfig();

  // Render content based on active tool
  const renderContent = () => {
    // BACKWARD COMPATIBILITY: If payload has custom content (for EditorProjectInfoPanel, EditorChapterInfoPanel, etc.), render it
    if (payload?.content) {
      return <div className="space-y-4">{payload.content}</div>;
    }

    // Otherwise use new tool-based content
    switch (activeTool) {
      case "inspector":
        return <InspectorDetails payload={payload} />;
      case "goals":
        return <GoalsPanel />;
      case "analytics":
        return <AnalyticsPanel />;
      case "comments":
        return <CommentsPanel />;
      case "history":
        return <HistoryPanel />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Side Tab - shows when closed, positioned at ToolRail edge */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => openInspector(undefined, "inspector")}
          className="fixed right-14 top-1/2 -translate-y-1/2 w-5 h-16 rounded-l-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow z-20"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
        </button>
      )}

      {/* Inspector Panel - slides in from right */}
      <aside
        data-inspector-sidebar="phase-1.5"
        className={`flex h-full flex-col border-l border-slate-200 bg-slate-50 relative transition-all duration-300 ease-out ${
          isOpen ? "w-[320px] opacity-100" : "w-0 opacity-0"
        }`}
      >
        {/* Side Tab - shows when open, positioned at left edge of inspector */}
        {isOpen && (
          <button
            type="button"
            onClick={closeInspector}
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-5 h-16 rounded-l-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow z-20"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </button>
        )}

        {isOpen && (
          <>
            {/* Header */}
            <header className="flex items-center justify-between px-3 py-2 border-b border-slate-200 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">{toolConfig.icon}</span>
                <div>
                  <h2 className="text-xs text-gray-900">{toolConfig.label}</h2>
                  {toolConfig.subtitle && (
                    <p className="text-[11px] text-gray-500">
                      {toolConfig.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-2 bg-white">
              {renderContent()}
            </div>

            {/* Footer - Delete Button (only for chapter/part inspector) */}
            {activeTool === "inspector" &&
              payload?.type === "chapter" &&
              typeof data.deleteChapter === "function" &&
              typeof data.chapter === "object" &&
              data.chapter &&
              "id" in data.chapter &&
              "title" in data.chapter && (
                <div className="border-t border-slate-200 px-3 py-3 bg-white flex-shrink-0">
                  <button
                    onClick={() => {
                      const chapter = data.chapter as {
                        id: string;
                        title?: string;
                      };
                      if (
                        confirm(
                          `Delete "${chapter.title}"? This action cannot be undone.`,
                        )
                      ) {
                        (data.deleteChapter as (id: string) => void)(
                          chapter.id,
                        );
                      }
                    }}
                    className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded bg-white hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Chapter
                  </button>
                </div>
              )}

            {activeTool === "inspector" &&
              payload?.type === "part" &&
              typeof data.deletePart === "function" &&
              typeof data.part === "object" &&
              data.part &&
              "id" in data.part &&
              "title" in data.part && (
                <div className="border-t border-slate-200 px-3 py-3 bg-white flex-shrink-0">
                  <button
                    onClick={() => {
                      const part = data.part as { id: string; title?: string };
                      if (
                        confirm(
                          `Delete "${part.title}"? Chapters in this part will become unassigned.`,
                        )
                      ) {
                        (data.deletePart as (id: string) => void)(part.id);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded bg-white hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Part
                  </button>
                </div>
              )}
          </>
        )}
      </aside>
    </>
  );
}
