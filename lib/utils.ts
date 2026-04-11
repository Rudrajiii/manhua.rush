import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a chapter was added within the last 2 days
 * @param createdAt - ISO date string of when the chapter was created
 * @returns true if the chapter is within the last 2 days, false otherwise
 */
export function isChapterNew(createdAt: string): boolean {
  const chapterDate = new Date(createdAt);
  const today = new Date();
  
  // Calculate the difference in milliseconds
  const diffMs = today.getTime() - chapterDate.getTime();
  
  // Convert to days
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  // Return true if the chapter is within the last 2 days
  return diffDays <= 2 && diffDays >= 0;
}
