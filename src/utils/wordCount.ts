import { stripHtml } from "./stripHtml";

export const computeWordCount = (html: string | undefined) => {
  const textContent = stripHtml(html || "").replace(/\s+/g, " ").trim();

  if (!textContent) {
    return 0;
  }

  return textContent.split(/\s+/).filter(Boolean).length;
};
