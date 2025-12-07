import type { Chapter, Theme, ThemeNote, Character, Part } from "../App";
import { booksApi } from "./books";
import { fetchJson } from "./client";
import { chaptersApi } from "./chapters";
import { partsApi } from "./parts";

export async function loadData(bookId?: string): Promise<{
  chapters: Chapter[];
  themes: Theme[];
  themeNotes: ThemeNote[];
  characters: Character[];
  parts: Part[];
}> {
  let resolvedBookId = bookId;

  if (!resolvedBookId) {
    const existingBooks = await booksApi.listAll();

    if (existingBooks.length > 0) {
      resolvedBookId = existingBooks[0].id;
    } else {
      const created = await booksApi.create({ title: "My Book", description: "" });
      resolvedBookId = created.id;
    }
  }

  if (!resolvedBookId) {
    throw new Error("Unable to resolve book context");
  }

  const [chapterData, partData, legacyData] = await Promise.all([
    chaptersApi.list(resolvedBookId),
    partsApi.list(resolvedBookId),
    fetchJson(`/data?bookId=${resolvedBookId}`).catch(() => ({
      themes: [],
      themeNotes: [],
      characters: [],
    } as Partial<{ themes: Theme[]; themeNotes: ThemeNote[]; characters: Character[] }>),
  ]);

  const themes = legacyData?.themes || [];
  const themeNotes = legacyData?.themeNotes || [];
  const characters = legacyData?.characters || [];

  return {
    chapters: chapterData,
    themes,
    themeNotes,
    characters,
    parts: partData,
  };
}

export async function saveChapter(chapter: Chapter): Promise<void> {
  await chaptersApi.create(chapter.bookId, chapter);
}

export async function updateChapter(
  bookId: string,
  id: string,
  updates: Partial<Chapter>,
): Promise<void> {
  await chaptersApi.update(bookId, id, updates);
}

export async function deleteChapter(bookId: string, id: string): Promise<void> {
  await chaptersApi.remove(bookId, id);
}

export async function saveTheme(theme: Theme): Promise<void> {
  await fetchJson("/theme", {
    method: "POST",
    body: JSON.stringify(theme),
  });
}

export async function updateTheme(id: string, updates: Partial<Theme>): Promise<void> {
  await fetchJson(`/theme/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteTheme(id: string): Promise<void> {
  await fetchJson(`/theme/${id}`, {
    method: "DELETE",
  });
}

export async function saveThemeNote(note: ThemeNote): Promise<void> {
  await fetchJson("/note", {
    method: "POST",
    body: JSON.stringify(note),
  });
}

export async function saveCharacter(character: Character): Promise<void> {
  await fetchJson("/character", {
    method: "POST",
    body: JSON.stringify(character),
  });
}

export async function deleteCharacter(id: string): Promise<void> {
  await fetchJson(`/character/${id}`, {
    method: "DELETE",
  });
}

export const manuscriptApi = {
  loadData,
  saveChapter,
  updateChapter,
  deleteChapter,
  saveTheme,
  updateTheme,
  deleteTheme,
  saveThemeNote,
  saveCharacter,
  deleteCharacter,
};
