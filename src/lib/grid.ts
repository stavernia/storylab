import { fetchLocalJson } from "@/api/http";

export type GridCell = {
  id: string;
  bookId: string;
  chapterId: string;
  themeId: string;
  presence: boolean;
  intensity: number;
  note: string | null;
  threadRole: string | null;
};

export type GridKey = `${string}:${string}:${string}`;

export function makeGridKey(bookId: string, chapterId: string, themeId: string): GridKey {
  return `${bookId}:${chapterId}:${themeId}`;
}

export function gridCellHasContent(cell: {
  presence?: boolean;
  intensity?: number | null;
  note?: string | null;
  threadRole?: string | null;
}): boolean {
  const noteValue = cell.note ?? "";
  const trimmedNote = typeof noteValue === "string" ? noteValue.trim() : "";
  const intensityValue = Number.isFinite(cell.intensity) ? Number(cell.intensity) : 0;

  return (
    trimmedNote !== "" ||
    cell.presence === true ||
    intensityValue > 0 ||
    !!cell.threadRole
  );
}

export type UpsertGridCellInput = {
  bookId: string;
  chapterId: string;
  themeId: string;
  presence?: GridCell["presence"];
  intensity?: GridCell["intensity"] | null;
  note?: GridCell["note"];
  threadRole?: GridCell["threadRole"];
};

export async function listGridCells(bookId: string): Promise<GridCell[]> {
  const { cells } = await fetchLocalJson<{ cells: GridCell[] }>(
    `/api/books/${bookId}/grid`,
  );

  return cells ?? [];
}

export async function upsertGridCell(input: UpsertGridCellInput): Promise<GridCell | null> {
  const { bookId, ...cell } = input;
  const payload = {
    chapterId: cell.chapterId,
    themeId: cell.themeId,
    presence: cell.presence ?? false,
    intensity: cell.intensity ?? 0,
    note: cell.note ?? null,
    threadRole: cell.threadRole ?? null,
  };

  const { cells } = await fetchLocalJson<{ cells: GridCell[] }>(
    `/api/books/${bookId}/grid`,
    {
      method: "POST",
      body: JSON.stringify({ cells: [payload] }),
    },
  );

  return cells?.[0] ?? null;
}
