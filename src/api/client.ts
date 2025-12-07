import { apiUrl, publicAnonKey } from "../utils/supabase/info";

export async function fetchJson(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    console.error(`API Error at ${endpoint}:`, error);
    throw new Error(error.error || "API request failed");
  }

  const data = await response.json();
  return data;
}
