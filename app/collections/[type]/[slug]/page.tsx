import React from 'react';
import { getManhuaBySlug } from '@/lib/api/manhua';
import { notFound } from 'next/navigation';
import DescriptionToggle from '@/app/components/DescriptionToggle';
import Link from 'next/link';
import { FaPlay } from "react-icons/fa";
import type { StaticImageData } from "next/image";
import ttp from "../../../../public/ttp.png"

type Props = {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ n?: string }>;
};

export default async function ManhuaDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { n } = await searchParams;

  // Use slug from URL or fallback to query param
  const manhuaSlug = slug || n || 'top-tier-providence';
  const manhua = await getManhuaBySlug(manhuaSlug);

  if (!manhua) {
    notFound();
  }

  return (
    <main className="manga-page">
      <div className="manga-header">
        <div className="cover">
          {manhua.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={manhua.cover} alt={manhua.title} className="cover-img" />
          ) : (
            <div style={{ width: '100%', height: 320, background: '#2d2d2d', borderRadius: 8 }} />
          )}
        </div>

        <div className="manga-info">
          <div className="title-row">
            <h1 className="manga-title">{manhua.title}</h1>
            <span className="manga-year">{manhua.year}</span>
          </div>

          {manhua.altTitles.length > 0 && (
            <p className="alt-titles">{manhua.altTitles.join(' / ')}</p>
          )}

          <div className="actions">
            {manhua.mangadexId && manhua.chapters && manhua.chapters.length > 0 ? (
              <Link
                href={`/reader/${manhua.mangadexId}/${manhua.chapters[0].chapter}`}
                className="btn-start"
              >
                Start Reading
              </Link>
            ) : (
              <button className="btn-start" disabled>Start Reading</button>
            )}
            <button className="icon-btn">{manhua.status}</button>
            {/* <button className="icon-btn">⚠</button> */}
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

          <section className="chapters-section">
            <h2 style={{ margin: 0, fontSize: 18 }}>Latest Chapters</h2>
            <div className="chapters-list">
              {manhua.chapters.length > 0 ? (
                manhua.chapters.map((chapter) => {
                  const uploaded = new Date(chapter.createdAt).toLocaleDateString();
                  return (
                    <Link
                      key={chapter.id}
                      href={`/reader/${manhua.mangadexId}/${chapter.chapter}`}
                      className={`chapter-item ${chapter.latest ? 'latest' : ''}`}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div className="chapter-title">
                            Ch. {chapter.chapter}
                            {chapter.title ? ` — ${chapter.title}` : ''}
                          </div>
                          {chapter.latest && (
                            <span className="latest-badge">
                              <span className="latest-dot" />
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="chapter-meta">Uploaded: {uploaded}</div>
                      </div>

                      <div className="chapter-meta">{chapter.language}</div>
                    </Link>
                  );
                })
              ) : (
                <div style={{ padding: 12, color: '#9ca3af' }}>No chapters found.</div>
              )}
            </div>
            <div className="chapters-footer mt-3">
              Little Reminder — to read previous chapters visit{' '}
              <a
                className="no-underline hover:underline"
                href="https://example.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#a78bfa' }}
              >
                this site
              </a>
              .
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
