import { fetchJson } from "./client";
import { getInitialRank } from "../utils/lexorank";
import type { Chapter } from "../App";

export type CorkboardBoard = {
  id: string;
  bookId: string;
  name: string;
  description?: string;
};

export interface CorkboardCard {
  id: string;
  bookId: string;
  title: string;
  summary?: string;
  notes?: string;
  chapterId?: string;
  color?: "blue" | "amber" | "gray" | "green" | "purple" | "red";
  status?: "idea" | "draft" | "done";
  laneRank: string;
  wordEstimate?: number;
  createdAt: string;
  updatedAt: string;
  boardId?: string;
  x?: number | null;
  y?: number | null;
  scope?: "book" | "part" | "chapter";
  partId?: string | null;
}

export interface CreateCardFromChapterResult {
  card: CorkboardCard;
  alreadyExists: boolean;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetchJson(endpoint, options);
  return response;
}

function htmlToPlainText(input: string): string {
  if (!input) return "";
  if (typeof window === "undefined") {
    return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = input;
  return (div.textContent || div.innerText || "").trim();
}

export const corkboardApi = {
  async loadCards(): Promise<CorkboardCard[]> {
    const { cards } = await fetchAPI("/corkboard/cards");
    return cards;
  },

  async createCard(card: CorkboardCard): Promise<void> {
    await fetchAPI("/corkboard/card", {
      method: "POST",
      body: JSON.stringify(card),
    });
  },

  async updateCard(id: string, updates: Partial<CorkboardCard>): Promise<void> {
    await fetchAPI(`/corkboard/card/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteCard(id: string): Promise<void> {
    await fetchAPI(`/corkboard/card/${id}`, {
      method: "DELETE",
    });
  },

  async loadBoards(): Promise<CorkboardBoard[]> {
    const data = await fetchAPI("/corkboard/boards");
    return data.boards || [];
  },

  async saveBoard(board: CorkboardBoard): Promise<void> {
    await fetchAPI("/corkboard/board", {
      method: "POST",
      body: JSON.stringify(board),
    });
  },

  async ensureMainBoard(): Promise<CorkboardBoard> {
    const boards = await this.loadBoards();
    if (boards && boards.length > 0) {
      return boards[0];
    }

    const mainBoard: CorkboardBoard = {
      id: "main-board",
      bookId: "default-book",
      name: "Main Board",
      description: "Default story board",
    };

    await this.saveBoard(mainBoard);
    return mainBoard;
  },

  async createCardFromChapter(
    chapter: Chapter,
  ): Promise<CreateCardFromChapterResult> {
    const board = await this.ensureMainBoard();

    const allCards = await this.loadCards();
    const existing = allCards.find(
      (c) => c.boardId === board.id && c.chapterId === chapter.id,
    );

    if (existing) {
      return { card: existing, alreadyExists: true };
    }

    const rawOutline = chapter.outline || "";
    const rawContent = chapter.content || "";
    const rawPreview = rawOutline.trim() || rawContent.trim() || "";
    const plainPreview = htmlToPlainText(rawPreview);

    const summary =
      plainPreview.length > 280
        ? plainPreview.slice(0, 277) + "…"
        : plainPreview;

    const newCard: CorkboardCard = {
      id: crypto.randomUUID(),
      bookId: "default-book",
      title: chapter.title || "Untitled chapter",
      summary,
      chapterId: chapter.id,
      boardId: board.id,
      x: null,
      y: null,
      color: "amber",
      status: "idea",
      laneRank: getInitialRank(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.createCard(newCard);
    return { card: newCard, alreadyExists: false };
  },
};
