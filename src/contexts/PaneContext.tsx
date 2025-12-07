import { createContext, useContext, ReactNode } from 'react';

export type PaneId = 'primary' | 'secondary';

const PaneContext = createContext<PaneId>('primary');

export const PaneProvider: React.FC<{ paneId: PaneId; children: ReactNode }> = ({
  paneId,
  children,
}) => (
  <PaneContext.Provider value={paneId}>{children}</PaneContext.Provider>
);

export function usePaneId(): PaneId {
  return useContext(PaneContext);
}
