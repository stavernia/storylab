import { ReactNode } from 'react';

interface BoardCanvasProps {
  children: ReactNode;
}

export function BoardCanvas({ children }: BoardCanvasProps) {
  return (
    <div className="inline-block min-w-full">
      <div className="inline-flex min-w-max gap-4 h-full items-stretch px-4 pb-4">
        {children}
      </div>
    </div>
  );
}