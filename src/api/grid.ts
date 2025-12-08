import type { ThemeNote } from "../App";
import { fetchLocalJson } from "./http";

export type GridCellPayload = Pick<ThemeNote, "chapterId" | "themeId"> &
  Partial<Pick<ThemeNote, "presence" | "intensity" | "note" | "threadRole">>;

export type GridCell = GridCellPayload & {
  id: string;
  bookId: string;
};

export const gridApi = {
  async list(bookId: string): Promise<GridCell[]> {
    const { cells } = await fetchLocalJson<{ cells: GridCell[] }>(
      `/api/books/${bookId}/grid`,
    );

    return cells || [];
  },

  async upsertMany(bookId: string, cells: GridCellPayload[]): Promise<GridCell[]> {
    const { cells: savedCells } = await fetchLocalJson<{ cells: GridCell[] }>(
      `/api/books/${bookId}/grid`,
      {
        method: "POST",
        body: JSON.stringify({ cells }),
      },
    );

    return savedCells || [];
  },

  async update(
    bookId: string,
    cellId: string,
    updates: Partial<Omit<GridCellPayload, "chapterId" | "themeId">>,
  ): Promise<GridCell> {
    const { cell } = await fetchLocalJson<{ cell: GridCell }>(
      `/api/books/${bookId}/grid/${cellId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );

    return cell;
  },

  async remove(bookId: string, cellId: string): Promise<void> {
    await fetchLocalJson(`/api/books/${bookId}/grid/${cellId}`, {
      method: "DELETE",
    });
  },
};
