import { useState, useRef, useEffect } from 'react';

interface ResizableSidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

export function ResizableSidebar({
  children,
  isOpen,
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 600,
  storageKey = 'sidebar-width'
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved) : defaultWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, width.toString());
  }, [width, storageKey]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth]);

  return (
    <div
      ref={sidebarRef}
      className="bg-slate-50 flex-shrink-0 relative h-full overflow-hidden transition-all duration-300 ease-out"
      style={{ 
        width: isOpen ? `${width}px` : '0px',
        borderRight: isOpen ? '1px solid rgb(229, 231, 235)' : 'none' // border-gray-200
      }}
    >
      <div
        className={`relative h-full flex flex-col transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: `${width}px` }}
      >
        {isOpen && children}
        
        {/* Resize handle */}
        {isOpen && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-10 border-r border-gray-200"
            onMouseDown={handleMouseDown}
            style={{
              backgroundColor: isResizing ? '#3b82f6' : 'transparent'
            }}
          />
        )}
      </div>
    </div>
  );
}