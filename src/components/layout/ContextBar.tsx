import React from 'react';

interface ContextBarProps {
  children?: React.ReactNode;
}

/**
 * Context Bar - View-specific controls that appear directly under the Top Bar
 * Examples: Cards/List toggle in Corkboard, Column size selector in Grid, etc.
 */
export function ContextBar({ children }: ContextBarProps) {
  if (!children) return null;
  
  return (
    <div className="h-10 border-b border-gray-200 bg-white flex items-center justify-between px-3">
      {children}
    </div>
  );
}
