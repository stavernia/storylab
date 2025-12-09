import type { Part } from "@/App";
import { partsApi } from "@/api/parts";

export async function createPart(
  data: { title: string; notes?: string; bookId: string },
): Promise<Part> {
  return partsApi.create(data.bookId, data);
}

export async function updatePart(
  bookId: string,
  id: string,
  data: Partial<Pick<Part, "title" | "notes" | "sortOrder">>,
): Promise<Part> {
  return partsApi.update(bookId, id, data);
}

export async function deletePart(bookId: string, id: string): Promise<void> {
  await partsApi.remove(bookId, id);
}

export async function reorderParts(bookId: string, parts: Part[]): Promise<void> {
  await partsApi.reorder(bookId, parts);
}