import React from 'react';

interface StatusBarProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function StatusBar({ leftContent, rightContent }: StatusBarProps) {
  return (
    <div className="h-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between px-3 text-xs text-gray-600 flex-shrink-0 relative z-50">
      <div className="flex items-center gap-4">
        {leftContent}
      </div>
      <div className="flex items-center gap-4">
        {rightContent}
      </div>
    </div>
  );
}