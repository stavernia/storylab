import { 
  PencilLine, 
  ClipboardList, 
  LayoutGrid, 
  Grid3x3, 
  Palette, 
  Users, 
  Rows3,
  BookMarked, // NEW: Multi-book support - Books view icon
  Settings // NEW: Settings view icon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AppViewId =
  | 'books' // NEW: Multi-book support
  | 'editor'
  | 'outline'
  | 'corkboard'
  | 'grid'
  | 'themes'
  | 'characters'
  | 'parts'
  | 'settings'; // Settings view

export interface AppViewDefinition {
  id: AppViewId;
  label: string;
  icon: LucideIcon;
  // whether this view uses a "binder"/chapter sidebar
  usesBinder: boolean;
  // whether to show a divider before this view
  dividerBefore?: boolean;
  // whether to show this view in the main navigation
  showInNav?: boolean;
}

export const APP_VIEWS: AppViewDefinition[] = [
  { id: 'books', label: 'Books', icon: BookMarked, usesBinder: false }, // NEW: Multi-book support - Add to top
  { id: 'editor', label: 'Manuscript', icon: PencilLine, usesBinder: true },
  { id: 'outline', label: 'Outline', icon: ClipboardList, usesBinder: true },
  { id: 'corkboard', label: 'Corkboard', icon: LayoutGrid, usesBinder: false },
  { id: 'grid', label: 'Grid', icon: Grid3x3, usesBinder: false },
  { id: 'characters', label: 'Characters', icon: Users, usesBinder: false, dividerBefore: true },
  { id: 'themes', label: 'Themes', icon: Palette, usesBinder: false },
  { id: 'parts', label: 'Parts', icon: Rows3, usesBinder: false },
  { id: 'settings', label: 'Settings', icon: Settings, usesBinder: false, showInNav: false }, // Settings shown only in bottom button
];

export function getViewDefinition(id: AppViewId): AppViewDefinition {
  const def = APP_VIEWS.find((v) => v.id === id);
  if (!def) {
    throw new Error(`Unknown AppViewId: ${id}`);
  }
  return def;
}