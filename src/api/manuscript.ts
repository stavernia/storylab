import type { Chapter, Theme, Character, Part } from "@/App";
import { chaptersApi } from "./chapters";
import { partsApi } from "./parts";
import { themesApi } from "./themes";
import { charactersApi } from "./characters";
import { fetchLocalJson } from "./http";
import { listGridCells } from "@/lib/grid";

export async function loadData(bookId: string): Promise<{
  chapters: Chapter[];
  themes: Theme[];
  gridCells: Awaited<ReturnType<typeof listGridCells>>;
  characters: Character[];
  parts: Part[];
}> {
  const resolvedBookId = bookId;

  const [chapterData, partData, themeData, themeNoteData, characterData] =
    await Promise.all([
      chaptersApi.list(resolvedBookId),
      partsApi.list(resolvedBookId),
      themesApi.list(resolvedBookId),
      listGridCells(resolvedBookId),
      charactersApi.list(resolvedBookId),
    ]);

  return {
    chapters: chapterData,
    themes: themeData,
    gridCells: themeNoteData,
    characters: characterData,
    parts: partData,
  };
}

export async function saveChapter(chapter: Chapter): Promise<Chapter> {
  const { bookId, ...chapterData } = chapter;

  if (!bookId) {
    throw new Error("bookId is required to save a chapter");
  }

  return chaptersApi.create(bookId, chapterData);
}

export async function updateChapter(
  bookId: string,
  id: string,
  updates: Partial<Chapter>,
): Promise<void> {
  const { bookId: _bookId, ...sanitizedUpdates } = updates as Partial<
    Chapter
  > & { bookId?: string };

  await chaptersApi.update(bookId, id, sanitizedUpdates);
}

type ManuscriptPayload = {
  content?: string;
  wordCount?: number;
  lastEdited?: Date | string;
};

type ManuscriptResponse = {
  chapterId: string;
  bookId: string;
  content: string;
  wordCount?: number;
  lastEdited?: string;
};

async function fetchManuscript(
  bookId: string,
  chapterId: string,
): Promise<ManuscriptResponse> {
  const { manuscript } = await fetchLocalJson<{ manuscript: ManuscriptResponse }>(
    `/api/books/${bookId}/chapters/${chapterId}/manuscript`,
  );

  return manuscript;
}

async function saveManuscript(
  bookId: string,
  chapterId: string,
  payload: ManuscriptPayload,
): Promise<ManuscriptResponse> {
  const { manuscript } = await fetchLocalJson<{ manuscript: ManuscriptResponse }>(
    `/api/books/${bookId}/chapters/${chapterId}/manuscript`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  return manuscript;
}

export async function deleteChapter(bookId: string, id: string): Promise<void> {
  await chaptersApi.remove(bookId, id);
}

export async function saveTheme(theme: Theme): Promise<Theme> {
  if (!theme.bookId) {
    throw new Error("bookId is required to save a theme");
  }

  return themesApi.create(theme.bookId, theme);
}

export async function updateTheme(
  bookId: string,
  id: string,
  updates: Partial<Theme>,
): Promise<void> {
  if (!bookId) {
    throw new Error("bookId is required to update a theme");
  }

  await themesApi.update(bookId, id, updates);
}

export async function deleteTheme(bookId: string, id: string): Promise<void> {
  if (!bookId) {
    throw new Error("bookId is required to delete a theme");
  }

  await themesApi.remove(bookId, id);
}

export async function saveCharacter(character: Character): Promise<void> {
  if (!character.bookId) {
    throw new Error("bookId is required to save a character");
  }

  await charactersApi.create(character.bookId, character);
}

export async function deleteCharacter(bookId: string, id: string): Promise<void> {
  if (!bookId) {
    throw new Error("bookId is required to delete a character");
  }

  await charactersApi.remove(bookId, id);
}

export const manuscriptApi = {
  loadData,
  saveChapter,
  updateChapter,
  deleteChapter,
  saveTheme,
  updateTheme,
  deleteTheme,
  saveCharacter,
  deleteCharacter,
  fetchManuscript,
  saveManuscript,
};
