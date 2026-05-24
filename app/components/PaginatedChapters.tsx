'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface Chapter {
  id: string;
  chapter: string;
  title?: string;
  createdAt: string;
  language?: string;
  latest?: boolean;
}

interface PaginatedChaptersProps {
  chapters: Chapter[];
  mangadexId?: string;
}

const CHAPTERS_PER_PAGE = 6;

export default function PaginatedChapters({ chapters, mangadexId }: PaginatedChaptersProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [highlightedChapterId, setHighlightedChapterId] = useState<string | null>(null);

  const totalPages = Math.ceil(chapters.length / CHAPTERS_PER_PAGE);
  const startIndex = (currentPage - 1) * CHAPTERS_PER_PAGE;
  const paginatedChapters = chapters.slice(startIndex, startIndex + CHAPTERS_PER_PAGE);

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    // Smooth scroll to chapters section
    const element = document.querySelector('.chapters-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearch = () => {
    if (!searchInput.trim()) {
      toast.error('Please enter a chapter number');
      return;
    }

    const searchValue = searchInput.trim();
    const foundChapter = chapters.find(
      (ch) => ch.chapter.toLowerCase() === searchValue.toLowerCase()
    );

    if (!foundChapter) {
      toast.error(`Chapter ${searchValue} not found`);
      setSearchInput('');
      return;
    }

    // Find the index of the found chapter
    const chapterIndex = chapters.indexOf(foundChapter);
    const pageNumber = Math.floor(chapterIndex / CHAPTERS_PER_PAGE) + 1;

    // Navigate to the correct page
    goToPage(pageNumber);
    setHighlightedChapterId(foundChapter.id);

    // Show success toast
    // toast.success(`Found Chapter ${foundChapter.chapter}`);

    // Clear search input and highlight after 2 seconds
    setTimeout(() => {
      setSearchInput('');
      setHighlightedChapterId(null);
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setHighlightedChapterId(null);
  };

  if (chapters.length === 0) {
    return (
      <section className="chapters-section">
        <h2 style={{ margin: 0, fontSize: 18 }}>Latest Chapters</h2>
        <div style={{ padding: 12, color: '#9ca3af' }}>No chapters found.</div>
      </section>
    );
  }

  return (
    <section className="chapters-section">
      <div className="chapters-header-wrapper">
        <div className="chapters-header-left">
          <h2 style={{ margin: 0, fontSize: 18 }}>Latest Chapters</h2>
        </div>

        {/* Search Bar & Counter Group */}
        <div className="chapters-search-counter-group">
          {/* Search Bar - Middle Position */}
          <div className="chapter-search-inline">
            <div className="chapter-search-input-group-inline">
              <Search size={15} className="search-icon ml-1" />
              <input
                type="text"
                placeholder="Search chapter (e.g., 253)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="chapter-search-input"
              />
              {searchInput && (
                <button
                  onClick={handleSearch}
                  className="chapter-search-btn-inline"
                  title="Search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="chapters-counter-simple">
            {startIndex + 1}–{Math.min(startIndex + CHAPTERS_PER_PAGE, chapters.length)} of {chapters.length}
          </div>
        </div>
      </div>

      <div className="chapters-list">
        {paginatedChapters.map((chapter) => {
          const uploaded = new Date(chapter.createdAt).toLocaleDateString();
          const href = mangadexId ? `/reader/${mangadexId}/${chapter.chapter}` : '#';
          const isHighlighted = highlightedChapterId === chapter.id;
          
          return (
            <Link
              key={chapter.id}
              href={href}
              className={`chapter-item ${chapter.latest ? 'latest' : ''} ${isHighlighted ? 'highlighted' : ''}`}
            >
              <div>
                <div className="chapter-title-row">
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
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <div className="pagination-indicators">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`pagination-indicator ${currentPage === page ? 'active' : ''}`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* <div className="chapters-footer mt-3">
        Little Reminder — to read previous chapters visit{' '}
        <a
          className="no-underline hover:underline"
          href="https://comix.to/home"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#a78bfa' }}
        >
          this site
        </a>
        .
      </div> */}
    </section>
  );
}
