import React from 'react';
import Link from 'next/link';
import { getManhuaBySlug } from '@/lib/api/manhua';
import { notFound } from 'next/navigation';
import DescriptionToggle from '@/app/components/DescriptionToggle';
import ViewCounter from '@/app/components/ViewCounter';
import LinkWithLoader from '@/app/components/LinkWithLoader';
import PaginatedChapters from '@/app/components/PaginatedChapters';
import CoverActionButtons from '@/app/components/CoverActionButtons';
import { FaPlay } from "react-icons/fa";

type Props = {
  searchParams: Promise<{ n?: string }>;
};

export default async function TopTierProvidencePage({ searchParams }: Props) {
  const { n } = await searchParams;

  const manhua = await getManhuaBySlug('top-tier-providence');

  if (!manhua) {
    notFound();
  }

  return (
    <main className="manga-page relative">
      {/* Cosmic Nebula Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 110% 70% at 25% 80%, rgba(147, 51, 234, 0.12), transparent 55%),
            radial-gradient(ellipse 130% 60% at 75% 15%, rgba(59, 130, 246, 0.10), transparent 65%),
            radial-gradient(ellipse 80% 90% at 20% 30%, rgba(236, 72, 153, 0.14), transparent 50%),
            radial-gradient(ellipse 100% 40% at 60% 70%, rgba(16, 185, 129, 0.08), transparent 45%),
            #000000
          `,
        }}
      />
      {manhua.notification && (
        <div className="series-notification relative z-10">
          <span className="series-notification-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <div>
            <span className="series-notification-label">Official Notice :</span>
            {manhua.notificationMsg ?? 'Stay tuned for updates on this series!'}
          </div>
        </div>
      )}
      <div className="manga-header relative z-10">
        <div className="cover-section">
          <div className="cover">
            {manhua.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={manhua.cover} alt={manhua.title} className="cover-img" />
            ) : (
              <div style={{ width: '100%', height: 320, background: '#2d2d2d', borderRadius: 8 }} />
            )}
          </div>
          
          {/* Cover Action Buttons */}
          <CoverActionButtons
            mangadexId={manhua.mangadexId}
            firstChapterNumber={
              manhua.chapters && manhua.chapters.length > 0
                ? manhua.chapters[0].chapter
                : undefined
            }
            seriesTitle={manhua.title}
          />
        </div>

        <div className="manga-info">
          <div className="title-row">
            <h1 className="manga-title">{manhua.title}</h1>
            <span className="manga-year">{manhua.year}</span>
          </div>

          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <ViewCounter slug={manhua.slug} />
          </div>

          {manhua.altTitles.length > 0 && (
            <p className="alt-titles">{manhua.altTitles.join(' / ')}</p>
          )}

          <div className="actions">
            {manhua.mangadexId && manhua.chapters && manhua.chapters.length > 0 ? (
              <LinkWithLoader
                href={`/reader/${manhua.mangadexId}/${manhua.chapters[0].chapter}`}
                className="btn-start"
                loadingText="Loading…"
              >
                Start Reading
              </LinkWithLoader>
            ) : (
              <button className="btn-start" disabled>Start Reading</button>
            )}
            <button className="icon-btn">{manhua.status}</button>
          </div>

          <DescriptionToggle text={manhua.description} maxChars={180} />

          {manhua.tags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {manhua.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <PaginatedChapters chapters={manhua.chapters} mangadexId={manhua.mangadexId} />
        </div>
      </div>
    </main>
  );
}
