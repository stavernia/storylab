import type { Chapter, Theme } from "@/App";
import { fetchLocalJson } from "./http";
import type { GridCell } from "./grid";

export type TimelineData = {
  chapters: Chapter[];
  themes: Theme[];
  gridCells: GridCell[];
};

export const timelineApi = {
  async get(bookId: string): Promise<TimelineData> {
    return fetchLocalJson<TimelineData>(`/api/books/${bookId}/timeline`);
  },
};
