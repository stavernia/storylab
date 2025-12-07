import { fetchJson } from "./client";
import type { Chapter, Theme, ThemeNote, Character, Part } from "../App";

export async function loadData(bookId?: string): Promise<{
  chapters: Chapter[];
  themes: Theme[];
  themeNotes: ThemeNote[];
  characters: Character[];
  parts: Part[];
}> {
  const endpoint = bookId ? `/data?bookId=${bookId}` : "/data";
  return fetchJson(endpoint);
}

export async function saveChapter(chapter: Chapter): Promise<void> {
  await fetchJson("/chapter", {
    method: "POST",
    body: JSON.stringify(chapter),
  });
}

export async function updateChapter(id: string, updates: Partial<Chapter>): Promise<void> {
  await fetchJson(`/chapter/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteChapter(id: string): Promise<void> {
  await fetchJson(`/chapter/${id}`, {
    method: "DELETE",
  });
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
