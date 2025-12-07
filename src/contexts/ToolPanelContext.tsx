import { createContext, useContext, useState, ReactNode } from 'react';

export type ToolId = 'inspector' | 'goals' | 'analytics' | 'comments' | 'history';

export interface ToolPanelContextValue {
  activeTool: ToolId | null;
  openTool: (tool: ToolId) => void;
  closeTool: () => void;
  toggleTool: (tool: ToolId) => void;
}

const ToolPanelContext = createContext<ToolPanelContextValue | undefined>(undefined);

export const ToolPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const openTool = (tool: ToolId) => {
    setActiveTool(tool);
  };

  const closeTool = () => {
    setActiveTool(null);
  };

  const toggleTool = (tool: ToolId) => {
    setActiveTool(prev => prev === tool ? null : tool);
  };

  return (
    <ToolPanelContext.Provider value={{ activeTool, openTool, closeTool, toggleTool }}>
      {children}
    </ToolPanelContext.Provider>
  );
};

export function useToolPanel(): ToolPanelContextValue {
  const context = useContext(ToolPanelContext);
  if (!context) {
    throw new Error('useToolPanel must be used within ToolPanelProvider');
  }
  return context;
}
