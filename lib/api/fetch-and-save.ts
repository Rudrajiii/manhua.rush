/**
 * Utility to fetch manga data from MangaDex and save to JSON
 * This is meant to be run manually or on first load to populate the JSON file
 */

type ManhuaDataEntry = {
  id: string;
  slug: string;
  name: string;
  mangadexId: string;
  type: 'manhua' | 'manga' | 'manhwa';
  cachedCoverUrl: string | null;
  // Cached data from MangaDex
  title?: string;
  year?: number;
  altTitles?: string[];
  description?: string;
  tags?: string[];
  status?: string;
};

/**
 * Fetch manga by title from MangaDex
 */
export async function fetchMangaByTitle(title: string) {
  try {
    const encodedTitle = encodeURIComponent(title);
    const res = await fetch(`https://api.mangadex.org/manga?title=${encodedTitle}`, {
      next: { revalidate: 0 } // Don't cache for initial fetch
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch manga: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    return data?.data?.[0] || null; // Return first result
  } catch (error) {
    console.error('Error fetching manga by title:', error);
    return null;
  }
}

/**
 * Get cover URL from MangaDex
 */
async function getCoverUrlFromMangaDex(mangadexId: string, coverRelationshipId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.mangadex.org/cover/${coverRelationshipId}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    const fileName = data.data?.attributes?.fileName;
    
    if (fileName) {
      return `https://uploads.mangadex.org/covers/${mangadexId}/${fileName}`;
    }
  } catch (error) {
    console.error('Error fetching cover:', error);
  }
  return null;
}

/**
 * Build complete manga data entry from MangaDex response
 */
export async function buildManhuaDataEntry(
  slug: string,
  searchTitle: string,
  type: 'manhua' | 'manga' | 'manhwa' = 'manhua'
): Promise<ManhuaDataEntry | null> {
  // Fetch manga by title
  const mangaData = await fetchMangaByTitle(searchTitle);
  
  if (!mangaData) {
    console.error(`No manga found for title: ${searchTitle}`);
    return null;
  }

  const mangadexId = mangaData.id;
  const attributes = mangaData.attributes;
  const relationships = mangaData.relationships || [];

  // Get cover URL
  const coverRel = relationships.find((r: any) => r.type === 'cover_art');
  let coverUrl: string | null = null;
  if (coverRel) {
    coverUrl = await getCoverUrlFromMangaDex(mangadexId, coverRel.id);
  }

  // Extract title
  const title = attributes.title?.en || Object.values(attributes.title || {})[0] || searchTitle;

  // Extract alt titles
  const altTitles = (attributes.altTitles || [])
    .flatMap((t: any) => Object.values(t))
    .filter(Boolean) as string[];

  // Extract description
  const description = attributes.description?.en || '';

  // Extract tags
  const tags = (attributes.tags || [])
    .map((t: any) => t.attributes?.name?.en)
    .filter(Boolean);

  return {
    id: slug,
    slug: slug,
    name: searchTitle,
    mangadexId: mangadexId,
    type: type,
    cachedCoverUrl: coverUrl,
    // Cached MangaDex data
    title: title,
    year: attributes.year || new Date().getFullYear(),
    altTitles: altTitles,
    description: description,
    tags: tags,
    status: attributes.status || 'ongoing'
  };
}

/**
 * Example usage - run this to populate JSON file
 */
export async function initializeManhuaData() {
  const entry = await buildManhuaDataEntry(
    'top-tier-providence',
    'Top Tier Providence',
    'manhua'
  );
  
  if (entry) {
    console.log('Manga data fetched successfully:');
    console.log(JSON.stringify({ [entry.slug]: entry }, null, 2));
    return entry;
  }
  
  return null;
}
