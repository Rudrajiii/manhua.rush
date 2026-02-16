import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { getManhuaBySlug } from '@/lib/api/manhua';
import CommentSection from '@/app/reader/CommentSection';
import ReaderControls from '@/app/reader/ReaderControls';
import ResizableReader from '@/app/reader/ResizableReader';
import ReaderPanels from '@/app/reader/ReaderPanels';
import ReaderTitle from '@/app/reader/ReaderTitle';
import manhuaData from '@/lib/data/manhua-data.json';
import { panelCache } from '@/lib/cache';

type Props = {
  params: Promise<{ mangadexId: string; chapter: string }> | { mangadexId: string; chapter: string };
};

function isImageFile(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['avif', 'webp', 'png', 'jpg', 'jpeg'].includes(ext);
}

interface ManifestPanel {
  order: number;
  cloudinary_url: string;
  obfuscated_name: string;
}

interface Manifest {
  manga_id: string;
  chapter: string;
  total_panels: number;
  panels: ManifestPanel[];
}

/**
 * Try to load panel URLs from Cloudinary manifest (scripts/manifests/).
 * Returns sorted Cloudinary URLs, or null if manifest doesn't exist.
 */
async function loadCloudPanels(mangadexId: string, chapter: string): Promise<string[] | null> {
  const cacheKey = `cloud-panels:${mangadexId}:${chapter}`;
  return panelCache.getOrSet<string[] | null>(cacheKey, async () => {
    const manifestPath = path.resolve(
      process.cwd(), 'scripts', 'manifests',
      `${mangadexId}_${chapter}.json`
    );
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8');
      const manifest: Manifest = JSON.parse(raw);
      const urls = manifest.panels
        .sort((a, b) => a.order - b.order)
        .map((p) => p.cloudinary_url)
        .filter(Boolean);
      return urls.length > 0 ? urls : null;
    } catch {
      return null;
    }
  }, 600);
}

/**
 * Fallback: load panel URLs from local production/ folder.
 */
async function loadLocalPanels(mangadexId: string, chapter: string): Promise<string[]> {
  const productionRoot = path.resolve(process.cwd(), 'production');
  const chapterDir = path.join(productionRoot, String(mangadexId), String(chapter));
  try {
    const items = await fs.readdir(chapterDir);
    const files = items.filter(isImageFile).sort((a, b) => {
      const na = a.match(/(\d+)/g)?.join('') || a;
      const nb = b.match(/(\d+)/g)?.join('') || b;
      return Number(na) - Number(nb);
    });
    return files.map((f) => `/api/prod-image/${mangadexId}/${chapter}/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export default async function ReaderPage({ params }: Props) {
  const resolvedParams = await params;
  const { mangadexId, chapter } = resolvedParams;

  if (!mangadexId || !chapter) {
    notFound();
  }

  // Find manga by mangadexId
  const data = manhuaData as Record<string, any>;
  const mangaEntry = Object.values(data).find((m: any) => m.mangadexId === mangadexId) as any;
  const manhua = mangaEntry ? await getManhuaBySlug(mangaEntry.slug) : null;

  if (!manhua) {
    notFound();
  }

  // Try Cloudinary manifest first, fall back to local production folder
  let imageUrls = await loadCloudPanels(mangadexId, chapter);
  const isCloud = imageUrls !== null;
  if (!imageUrls) {
    imageUrls = await loadLocalPanels(mangadexId, chapter);
  }

  const panelsContent = <ReaderPanels imageUrls={imageUrls} isCloud={isCloud} />;

  const sidebarContent = <CommentSection mangaId={mangadexId} chapter={chapter} />;

  return (
    <div className="reader-container">
      {/* Reader Header with all controls */}
      <header className="reader-header-bar">
        <div className="reader-brand">ManhuaRush</div>
        <ReaderTitle title={manhua.title} chapter={chapter} />
        <div className="reader-controls-wrapper">
          <ReaderControls
            mangaId={mangadexId}
            currentChapter={chapter}
            chapters={manhua.chapters}
            mangaTitle={manhua.title}
            mangaSlug={manhua.slug}
          />
        </div>
      </header>

      {/* Main Content - Resizable Layout */}
      <ResizableReader panels={panelsContent} sidebar={sidebarContent} />
    </div>
  );
}
