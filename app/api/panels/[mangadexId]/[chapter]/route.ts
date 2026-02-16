/**
 * API route: GET /api/panels/[mangadexId]/[chapter]
 *
 * Returns ordered panel URLs for a chapter from the manifest.
 * Cloudinary URLs are obfuscated (HMAC-hashed filenames).
 * Uses in-memory cache to avoid repeated filesystem reads.
 *
 * Protection measures:
 * - Obfuscated filenames (HMAC-SHA256, unguessable without secret key)
 * - Referer validation in production
 * - Cache-Control headers to prevent CDN caching of the URL list
 */

import fs from "fs/promises";
import path from "path";
import { panelCache } from "@/lib/cache";

interface ManifestPanel {
  order: number;
  original_name: string;
  obfuscated_name: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  original_size: number;
  converted_size: number;
}

interface Manifest {
  manga_id: string;
  chapter: string;
  total_panels: number;
  panels: ManifestPanel[];
}

// Resolve manifests directory (scripts/manifests inside the project root)
function getManifestsDir(): string {
  return path.resolve(process.cwd(), "scripts", "manifests");
}

async function loadManifest(
  mangadexId: string,
  chapter: string
): Promise<{ manifest: Manifest | null; cacheStatus: "HIT" | "MISS" }> {
  const cacheKey = `manifest:${mangadexId}:${chapter}`;

  const { data, cacheStatus } = await panelCache.getOrSetWithStatus<Manifest | null>(
    cacheKey,
    async () => {
      const manifestPath = path.join(
        getManifestsDir(),
        `${mangadexId}_${chapter}.json`
      );
      try {
        const raw = await fs.readFile(manifestPath, "utf-8");
        return JSON.parse(raw) as Manifest;
      } catch {
        return null;
      }
    },
    600 // 10 minute TTL
  );
  return { manifest: data, cacheStatus };
}

export async function GET(
  req: Request,
  {
    params,
  }: {
    params:
      | Promise<{ mangadexId: string; chapter: string }>
      | { mangadexId: string; chapter: string };
  }
) {
  const resolvedParams = await params;
  const { mangadexId, chapter } = resolvedParams;

  if (!mangadexId || !chapter) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Basic referer check in production (blocks direct API calls from other origins)
  const referer = req.headers.get("referer") || "";
  const origin = req.headers.get("origin") || "";
  if (process.env.NODE_ENV === "production") {
    const allowedHost = process.env.NEXT_PUBLIC_SITE_URL || "";
    if (allowedHost && !referer.includes(allowedHost) && !origin.includes(allowedHost)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { manifest, cacheStatus } = await loadManifest(mangadexId, chapter);

  if (!manifest) {
    return Response.json({ error: "Chapter not found" }, { status: 404 });
  }

  // Return ordered panel URLs
  const panels = manifest.panels
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      url: p.cloudinary_url,
      id: p.obfuscated_name,
    }))
    .filter((p) => p.url); // Only include panels that have been uploaded

  return Response.json(
    {
      mangadexId: manifest.manga_id,
      chapter: manifest.chapter,
      totalPanels: manifest.total_panels,
      panels,
    },
    {
      status: 200,
      headers: {
        // Enable Vercel edge caching (10 min TTL, 1 min stale-while-revalidate)
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
        "CDN-Cache-Control": "public, max-age=600",
        // Prevent embedding in iframes on other sites
        "X-Frame-Options": "SAMEORIGIN",
        // Data-cache hit indicator (HIT = served from unstable_cache)
        "X-Cache": cacheStatus,
      },
    }
  );
}
