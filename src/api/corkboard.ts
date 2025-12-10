import { fetchLocalJson } from "./http";
import { getInitialRank } from "@/utils/lexorank";
import type { Chapter } from "@/App";

export type CorkboardBoard = {
  id: string;
  bookId: string;
  name: string;
  description?: string | null;
  sortOrder?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export interface CorkboardCard {
  id: string;
  bookId: string;
  title: string;
  summary?: string | null;
  notes?: string | null;
  chapterId?: string | null;
  color?: "blue" | "amber" | "gray" | "green" | "purple" | "red" | string;
  status?: "idea" | "draft" | "done" | string;
  laneRank: string;
  wordEstimate?: number | null;
  createdAt: string;
  updatedAt: string;
  boardId?: string | null;
  x?: number | null;
  y?: number | null;
  scope?: "book" | "part" | "chapter" | string;
  partId?: string | null;
}

export interface CreateCardFromChapterResult {
  card: CorkboardCard;
  alreadyExists: boolean;
}

export type CreateBoardInput = Pick<CorkboardBoard, "name" | "description" | "sortOrder">;
export type UpdateBoardInput = Partial<CreateBoardInput>;

export type CreateCardInput = {
  title: string;
  summary?: string | null;
  notes?: string | null;
  status?: CorkboardCard["status"];
  color?: CorkboardCard["color"];
  laneRank?: string;
  wordEstimate?: number | null;
  chapterId?: string | null;
  partId?: string | null;
  boardId?: string | null;
  scope?: CorkboardCard["scope"];
  x?: number | null;
  y?: number | null;
};

export type UpdateCardInput = Partial<CreateCardInput>;

function requireBookId(bookId?: string): asserts bookId {
  if (!bookId) {
    throw new Error("bookId is required for corkboard operations");
  }
}

export const corkboardApi = {
  async loadCards(
    bookId: string,
    filters?: { boardId?: string; chapterId?: string; partId?: string; scope?: string },
  ): Promise<CorkboardCard[]> {
    requireBookId(bookId);

    const searchParams = new URLSearchParams();
    if (filters?.boardId) searchParams.set("boardId", filters.boardId);
    if (filters?.chapterId) searchParams.set("chapterId", filters.chapterId);
    if (filters?.partId) searchParams.set("partId", filters.partId);
    if (filters?.scope) searchParams.set("scope", filters.scope);

    const query = searchParams.toString();
    const endpoint = query
      ? `/api/books/${bookId}/corkboard/cards?${query}`
      : `/api/books/${bookId}/corkboard/cards`;

    const { cards } = await fetchLocalJson<{ cards: CorkboardCard[] }>(endpoint);
    return cards || [];
  },

  async createCard(bookId: string, data: CreateCardInput): Promise<CorkboardCard> {
    requireBookId(bookId);

    const { card } = await fetchLocalJson<{ card: CorkboardCard }>(
      `/api/books/${bookId}/corkboard/cards`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    return card;
  },

  async updateCard(
    bookId: string,
    id: string,
    updates: UpdateCardInput,
  ): Promise<CorkboardCard> {
    requireBookId(bookId);

    const { card } = await fetchLocalJson<{ card: CorkboardCard }>(
      `/api/books/${bookId}/corkboard/cards/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );

    return card;
  },

  async deleteCard(bookId: string, id: string): Promise<void> {
    requireBookId(bookId);

    await fetchLocalJson(`/api/books/${bookId}/corkboard/cards/${id}`, {
      method: "DELETE",
    });
  },

  async loadBoards(bookId: string): Promise<CorkboardBoard[]> {
    requireBookId(bookId);

    const data = await fetchLocalJson<{ boards: CorkboardBoard[] }>(
      `/api/books/${bookId}/corkboard/boards`,
    );
    return data.boards || [];
  },

  async createBoard(bookId: string, board: CreateBoardInput): Promise<CorkboardBoard> {
    requireBookId(bookId);

    const { board: created } = await fetchLocalJson<{ board: CorkboardBoard }>(
      `/api/books/${bookId}/corkboard/boards`,
      {
        method: "POST",
        body: JSON.stringify(board),
      },
    );

    return created;
  },

  async updateBoard(
    bookId: string,
    boardId: string,
    updates: UpdateBoardInput,
  ): Promise<CorkboardBoard> {
    requireBookId(bookId);

    const { board } = await fetchLocalJson<{ board: CorkboardBoard }>(
      `/api/books/${bookId}/corkboard/boards/${boardId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );

    return board;
  },

  async deleteBoard(bookId: string, boardId: string): Promise<void> {
    requireBookId(bookId);

    await fetchLocalJson(`/api/books/${bookId}/corkboard/boards/${boardId}`, {
      method: "DELETE",
    });
  },

  async ensureMainBoard(bookId: string): Promise<CorkboardBoard> {
    requireBookId(bookId);
    const boards = await this.loadBoards(bookId);
    if (boards && boards.length > 0) {
      return boards[0];
    }

    const mainBoard: CreateBoardInput = {
      name: "Main Board",
      description: "Default story board",
      sortOrder: 0,
    };

    return this.createBoard(bookId, mainBoard);
  },

  async createCardFromChapter(
    chapter: Chapter,
    bookId: string,
  ): Promise<CreateCardFromChapterResult> {
    requireBookId(bookId);
    const board = await this.ensureMainBoard(bookId);

    const allCards = await this.loadCards(bookId, { boardId: board.id });
    const existing = allCards.find((c) => c.boardId === board.id && c.chapterId === chapter.id);

    if (existing) {
      return { card: existing, alreadyExists: true };
    }

    const rawOutline = chapter.outline || "";
    const rawContent = chapter.content || "";
    const rawPreview = rawOutline.trim() || rawContent.trim() || "";
    const plainPreview = htmlToPlainText(rawPreview);

    const summary =
      plainPreview.length > 280 ? `${plainPreview.slice(0, 277)}…` : plainPreview;

    const newCardInput: CreateCardInput = {
      title: chapter.title || "Untitled chapter",
      summary,
      chapterId: chapter.id,
      boardId: board.id,
      color: "amber",
      status: "idea",
      laneRank: getInitialRank(),
      x: null,
      y: null,
    };

    const card = await this.createCard(bookId, newCardInput);
    return { card, alreadyExists: false };
  },
};

function htmlToPlainText(input: string): string {
  if (!input) return "";
  if (typeof window === "undefined") {
    return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = input;
  return (div.textContent || div.innerText || "").trim();
}
