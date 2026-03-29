export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const CATEGORIES = [
  "Family",
  "Health",
  "Finances",
  "Work",
  "Church",
  "Relationships",
  "Personal",
  "Other",
] as const;

export type PrayerCategory = (typeof CATEGORIES)[number];

export const ADMIN_EMAILS = ["devland0831@gmail.com"];
