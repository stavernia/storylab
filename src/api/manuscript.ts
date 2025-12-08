import type { Chapter, Theme, ThemeNote, Character, Part } from "../App";
import { booksApi } from "./books";
import { chaptersApi } from "./chapters";
import { partsApi } from "./parts";
import { themesApi, themeNotesApi } from "./themes";
import { charactersApi } from "./characters";

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

  const [chapterData, partData, themeData, themeNoteData, characterData] =
    await Promise.all([
      chaptersApi.list(resolvedBookId),
      partsApi.list(resolvedBookId),
      themesApi.list(resolvedBookId),
      themeNotesApi.list(resolvedBookId),
      charactersApi.list(resolvedBookId),
    ]);

  return {
    chapters: chapterData,
    themes: themeData,
    themeNotes: themeNoteData,
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

export async function saveThemeNote(bookId: string, note: ThemeNote): Promise<void> {
  if (!bookId) {
    throw new Error("bookId is required to save a theme note");
  }

  await themeNotesApi.save(bookId, note);
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
  saveThemeNote,
  saveCharacter,
  deleteCharacter,
};
