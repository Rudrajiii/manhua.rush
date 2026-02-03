import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { getManhuaBySlug } from '@/lib/api/manhua';
import CommentSection from '@/app/reader/CommentSection';
import ReaderControls from '@/app/reader/ReaderControls';
import ResizableReader from '@/app/reader/ResizableReader';
import ReaderPanels from '@/app/reader/ReaderPanels';
import manhuaData from '@/lib/data/manhua-data.json';

type Props = {
  params: Promise<{ mangadexId: string; chapter: string }> | { mangadexId: string; chapter: string };
};

function isImageFile(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['avif', 'webp', 'png', 'jpg', 'jpeg'].includes(ext);
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

  const productionRoot = path.resolve(process.cwd(), 'production');
  const chapterDir = path.join(productionRoot, String(mangadexId), String(chapter));

  let files: string[] = [];
  try {
    const items = await fs.readdir(chapterDir);
    files = items.filter(isImageFile).sort((a, b) => {
      const na = a.match(/(\d+)/g)?.join('') || a;
      const nb = b.match(/(\d+)/g)?.join('') || b;
      return Number(na) - Number(nb);
    });
  } catch (e) {
    // no files
    files = [];
  }

  const imageUrls = files.map((f) => `/api/prod-image/${mangadexId}/${chapter}/${encodeURIComponent(f)}`);

  const panelsContent = <ReaderPanels imageUrls={imageUrls} />;

  const sidebarContent = <CommentSection mangaId={mangadexId} chapter={chapter} />;

  return (
    <div className="reader-container">
      {/* Reader Header with all controls */}
      <header className="reader-header-bar">
        <div className="reader-brand">ManhuaRush</div>
        <div className="reader-title-section">
          <h1 className="reader-manga-title">{manhua.title}</h1>
          <span className="reader-chapter-badge">Chapter {chapter}</span>
        </div>
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
