import { createContext, useContext, useState, ReactNode } from 'react';

// Phase 1.5: New unified inspector types
export type InspectorTool = 'inspector' | 'goals' | 'analytics' | 'comments' | 'history';

export interface InspectorPayload {
  // NEW API: Structured data payload for different entity types
  type?: 'chapter' | 'theme' | 'character' | 'card' | 'gridTheme' | 'gridCell' | 'part';
  id?: string;
  data?: Record<string, unknown>;
  
  // BACKWARD COMPATIBILITY: For EditorProjectInfoPanel, EditorChapterInfoPanel, etc.
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  content?: ReactNode;
}

export interface InspectorContextValue {
  isOpen: boolean;
  activeTool: InspectorTool;
  payload: InspectorPayload | null;
  openInspector: (payload?: InspectorPayload, tool?: InspectorTool) => void;
  refreshInspectorPayload: (payload: InspectorPayload) => void;
  closeInspector: () => void;
  setInspectorTool: (tool: InspectorTool) => void;
}

const InspectorContext = createContext<InspectorContextValue | undefined>(undefined);

export const InspectorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<InspectorTool>('inspector');
  const [payload, setPayload] = useState<InspectorPayload | null>(null);

  const openInspector = (newPayload?: InspectorPayload, tool?: InspectorTool) => {
    if (isOpen && newPayload && payload) {
      const isSameItemWithId =
        newPayload.type === payload.type &&
        newPayload.id === payload.id &&
        newPayload.type !== undefined &&
        newPayload.id !== undefined;

      const isSameItemWithTitle =
        newPayload.title !== undefined && newPayload.title === payload.title;

      if (isSameItemWithId || isSameItemWithTitle) {
        setIsOpen(false);
        return;
      }
    }

    setIsOpen(true);
    if (newPayload !== undefined) {
      setPayload(newPayload);
    }
    if (tool) {
      setActiveTool(tool);
    }
    // If neither provided, keep current state but open the inspector
  };

  const refreshInspectorPayload = (newPayload: InspectorPayload) => {
    setPayload(newPayload);
    setIsOpen(true);
  };

  const closeInspector = () => {
    setIsOpen(false);
  };

  const setInspectorTool = (tool: InspectorTool) => {
    setActiveTool(tool);
  };

  return (
    <InspectorContext.Provider
      value={{
        isOpen,
        activeTool,
        payload,
        openInspector,
        refreshInspectorPayload,
        closeInspector,
        setInspectorTool,
      }}
    >
      {children}
    </InspectorContext.Provider>
  );
};

export function useInspector(): InspectorContextValue {
  const context = useContext(InspectorContext);
  if (!context) {
    throw new Error('useInspector must be used within InspectorProvider');
  }
  
  return context;
}
