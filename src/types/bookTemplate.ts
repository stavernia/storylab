export type BookTemplate = {
  book: {
    title: string;
    description?: string | null;
    chapterNumbering?: "per-book" | "per-part" | null;
  };
  parts?: Array<{
    title: string;
    sortOrder?: number | null;
    notes?: string | null;
  }>;
  chapters?: Array<{
    title: string;
    content?: string | null;
    outline?: string | null;
    outlinePOV?: string | null;
    outlinePurpose?: string | null;
    outlineEstimate?: number | null;
    outlineGoal?: string | null;
    outlineConflict?: string | null;
    outlineStakes?: string | null;
    customOutlineFields?: Record<string, unknown> | null;
    sortOrder?: number | null;
    wordCount?: number | null;
    lastEdited?: string | null;
    partIndex?: number | null;
  }>;
  themes?: Array<{
    name: string;
    color: string;
    kind?: string | null;
    source?: string | null;
    mode?: string | null;
    sourceRefId?: string | null;
    description?: string | null;
    aiGuide?: string | null;
    rowOrder?: number | null;
    isHidden?: boolean | null;
    threadLabel?: string | null;
  }>;
  tags?: Array<{
    name: string;
    color?: string | null;
  }>;
  characters?: Array<{
    name: string;
    color: string;
    role?: string | null;
    notes?: string | null;
  }>;
  boards?: Array<{
    name: string;
    description?: string | null;
    sortOrder?: number | null;
  }>;
  cards?: Array<{
    title: string;
    summary?: string | null;
    notes?: string | null;
    status?: string | null;
    color?: string | null;
    laneRank?: string | null;
    wordEstimate?: number | null;
    x?: number | null;
    y?: number | null;
    scope?: string | null;
    boardIndex?: number | null;
    chapterIndex?: number | null;
    partIndex?: number | null;
  }>;
  gridCells?: Array<{
    chapterIndex: number;
    themeIndex: number;
    presence?: boolean | null;
    intensity?: number | null;
    note?: string | null;
    threadRole?: string | null;
  }>;
};
