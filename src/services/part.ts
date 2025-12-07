import type { Part } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-841a689e`;

export async function fetchParts(): Promise<Part[]> {
  const response = await fetch(`${SERVER_URL}/parts`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch parts');
  }

  const parts = await response.json();
  return parts;
}

export async function createPart(data: { title: string; notes?: string; bookId: string }): Promise<Part> {
  const response = await fetch(`${SERVER_URL}/part`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create part');
  }

  const part = await response.json();
  return part;
}

export async function updatePart(
  id: string,
  data: Partial<Pick<Part, 'title' | 'notes'>>
): Promise<Part> {
  const response = await fetch(`${SERVER_URL}/part/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update part');
  }

  const part = await response.json();
  return part;
}

export async function deletePart(id: string): Promise<void> {
  const response = await fetch(`${SERVER_URL}/part/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete part');
  }
}

export async function reorderParts(parts: Part[]): Promise<void> {
  const reorderData = parts.map((part, index) => ({
    id: part.id,
    sortOrder: index,
  }));

  const response = await fetch(`${SERVER_URL}/parts/reorder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(reorderData),
  });

  if (!response.ok) {
    throw new Error('Failed to reorder parts');
  }
}