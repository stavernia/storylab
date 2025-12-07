import { useEffect, useState } from 'react';

export type InfoPanelLayout = 'center' | 'side';

const STORAGE_KEY = 'storylab:infoPanelLayout';

export function useInfoPanelLayout(): [InfoPanelLayout, (layout: InfoPanelLayout) => void] {
  const [layout, setLayoutState] = useState<InfoPanelLayout>('center');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as InfoPanelLayout | null;
      if (stored === 'center' || stored === 'side') {
        setLayoutState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLayout = (next: InfoPanelLayout) => {
    setLayoutState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return [layout, setLayout];
}
