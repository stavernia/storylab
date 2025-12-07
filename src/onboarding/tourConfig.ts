export type TourStepId =
  | 'welcome'
  | 'library'
  | 'appRail'
  | 'workspace'
  | 'breadcrumbs'
  | 'utilityRail'
  | 'dualPane'
  | 'settings'
  | 'ready';

export type TourTargetId =
  | 'center'
  | 'libraryBooks'
  | 'appRail'
  | 'workspace'
  | 'breadcrumbs'
  | 'utilityRail'
  | 'settings';

export type TourRouteId = 'library' | 'manuscript';

export type PaneLayoutMode = 'single' | 'dual';

export interface TourStep {
  id: TourStepId;
  title: string;
  body: string;
  /** What part of the UI to highlight */
  target: TourTargetId;
  /** Where the app should be (route) */
  route: TourRouteId;
  /** Optional view + layout hints for manuscript route */
  viewId?: 'editor' | 'outline' | 'corkboard' | 'grid' | 'themes' | 'characters' | 'parts';
  paneLayout?: PaneLayoutMode;
  /** Optional explicit left/right views for dual pane step */
  leftViewId?: 'editor' | 'outline' | 'corkboard' | 'grid' | 'themes' | 'characters' | 'parts';
  rightViewId?: 'editor' | 'outline' | 'corkboard' | 'grid' | 'themes' | 'characters' | 'parts';
  /** Optional: should inspector be open? */
  inspectorOpen?: boolean;
  /** Optional: which chapter index to select (0-based) */
  selectChapterIndex?: number;
  /** Optional: manuscript selection to show (default is chapter) */
  manuscriptSelection?: 'chapter' | 'part' | 'manuscript';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to StoryLab',
    body: 'StoryLab helps you see your book from every angle: pages, outline, themes, characters, and more. This quick tour will show you around.',
    target: 'center',
    route: 'library',
  },
  {
    id: 'library',
    title: 'Your Library',
    body: 'This is your Library. Create new books with "New Book", or open an existing one. We have started you with a sample project so you can explore.',
    target: 'libraryBooks',
    route: 'library',
  },
  {
    id: 'appRail',
    title: 'Views & Tools',
    body: 'Use the icons on the left to switch views: Manuscript for writing, Outline for summaries, Corkboard for cards, Grid for themes and characters, and Managers for lists of people, themes, and parts.',
    target: 'appRail',
    route: 'manuscript',
    viewId: 'editor',
    paneLayout: 'single',
    manuscriptSelection: 'manuscript',
  },
  {
    id: 'workspace',
    title: 'Your Workspace',
    body: 'Your workspace has three main areas: the Chapters list on the left, your writing canvas in the center, and supporting details on the right.',
    target: 'workspace',
    route: 'manuscript',
    viewId: 'editor',
    paneLayout: 'single',
    inspectorOpen: true,
    selectChapterIndex: 0,
    manuscriptSelection: 'manuscript',
  },
  {
    id: 'breadcrumbs',
    title: 'Context & Navigation',
    body: 'The top bar shows where you are: View → Book → Part → Chapter. You can use these breadcrumbs to quickly jump between parts and chapters. Filters live here too and will grow over time.',
    target: 'breadcrumbs',
    route: 'manuscript',
    viewId: 'editor',
    paneLayout: 'single',
    inspectorOpen: false,
    selectChapterIndex: 0,
    manuscriptSelection: 'chapter',
  },
  {
    id: 'utilityRail',
    title: 'Inspector & Tools',
    body: 'On the right, the Utility Rail switches the inspector: outline metadata, goals, analytics, comments, and history. Think of it as your sidekick while you write.',
    target: 'utilityRail',
    route: 'manuscript',
  },
  {
    id: 'dualPane',
    title: 'Dual Pane',
    body: 'You can open two views side-by-side — for example, Manuscript with Outline, or Grid with Manuscript. It is perfect for revising and cross-checking structure as you go.',
    target: 'workspace',
    route: 'manuscript',
    paneLayout: 'dual',
    leftViewId: 'editor',
    rightViewId: 'outline',
    selectChapterIndex: 0,
    manuscriptSelection: 'chapter',
  },
  {
    id: 'settings',
    title: 'Settings & Profile',
    body: 'From here you will manage your profile and app preferences. If you find bugs or have suggestions, please use the "Send Feedback" button here.',
    target: 'settings',
    route: 'manuscript',
  },
  {
    id: 'ready',
    title: 'You are Ready to Write',
    body: 'That is it for the quick tour. Start exploring the sample book, or create your own. You can always reopen this tour later from Settings.',
    target: 'center',
    route: 'manuscript',
  },
];

export const FIRST_TOUR_STEP_ID: TourStepId = 'welcome';
export const LAST_TOUR_STEP_ID: TourStepId = 'ready';
export const TOUR_STORAGE_KEY = 'sl_onboarding_dismissed_v1';