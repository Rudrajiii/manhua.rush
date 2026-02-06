import manhuaData from '@/lib/data/manhua-data.json';

export type Chapter = {
  id: string;
  chapter: string;
  title: string;
  createdAt: string;
  latest: boolean;
  link?: string;
  language?: string;
};

export type Manhua = {
  id: string;
  slug: string;
  mangadexId?: string;
  title: string;
  type: 'manhua' | 'manga' | 'manhwa';
  year: number;
  altTitles: string[];
  description: string;
  cover: string;
  tags: string[];
  chapters: Chapter[];
  status:String
};

// Internal type matching the JSON structure
type ManhuaDataEntry = {
  id: string;
  slug: string;
  name: string;
  mangadexId: string;
  type: 'manhua' | 'manga' | 'manhwa';
  cachedCoverUrl: string;
  title: string;
  year: number;
  altTitles: string[];
  description: string;
  tags: string[];
  chapters: Chapter[];
  status: string;
};

/**
 * Transform JSON data entry to Manhua type
 */
function transformToManhua(entry: ManhuaDataEntry): Manhua {
  // Convert MangaDex URLs to use proxy
  let coverUrl = entry.cachedCoverUrl;
  if (coverUrl && coverUrl.includes('uploads.mangadex.org/')) {
    // Extract path after uploads.mangadex.org/
    const path = coverUrl.replace('https://uploads.mangadex.org/', '');
    coverUrl = `/api/mangadex-proxy/${path}`;
  }

  return {
    id: entry.id,
    mangadexId: entry.mangadexId,
    slug: entry.slug,
    title: entry.title,
    type: entry.type,
    year: entry.year,
    altTitles: entry.altTitles,
    description: entry.description,
    cover: coverUrl,
    tags: entry.tags,
    chapters: entry.chapters,
    status: entry.status
  };
}

/**
 * Get all manhua entries
 */
export async function getAllManhua(): Promise<Manhua[]> {
  // Simulate async behavior for consistency
  await new Promise((resolve) => setTimeout(resolve, 10));
  const entries = Object.values(manhuaData) as ManhuaDataEntry[];
  return entries.map(transformToManhua);
}

/**
 * Get manhua by slug
 */
export async function getManhuaBySlug(slug: string): Promise<Manhua | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  const data = manhuaData as Record<string, ManhuaDataEntry>;
  const entry = data[slug];
  return entry ? transformToManhua(entry) : null;
}

/**
 * Get all manhua by type
 */
export async function getManhuaByType(type: 'manhua' | 'manga' | 'manhwa'): Promise<Manhua[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  const entries = Object.values(manhuaData) as ManhuaDataEntry[];
  return entries.filter((item) => item.type === type).map(transformToManhua);
}

/**
 * Search manhua by title
 */
export async function searchManhua(query: string): Promise<Manhua[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  const entries = Object.values(manhuaData) as ManhuaDataEntry[];
  const q = query.toLowerCase();
  return entries
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.altTitles.some((alt) => alt.toLowerCase().includes(q))
    )
    .map(transformToManhua);
}
