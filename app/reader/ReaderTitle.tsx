'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChapterDropdown from '@/app/components/ChapterDropdown';

interface Chapter {
  id: string;
  chapter: string;
  title: string;
}

interface ReaderTitleProps {
  title: string;
  chapter: string;
  maxChapter?: number;
  chapters?: Chapter[];
  mangaId?: string;
}

export default function ReaderTitle({ title, chapter, maxChapter, chapters = [], mangaId }: ReaderTitleProps) {
  const router = useRouter();
  const [displayTitle, setDisplayTitle] = useState(title);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateTitle = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      
      // For tablet devices (769px - 1024px), truncate title
      if (width > 768 && width <= 1024) {
        const maxLength = 30;
        if (title.length > maxLength) {
          setDisplayTitle(title.substring(0, maxLength) + '...');
        } else {
          setDisplayTitle(title);
        }
      } else {
        setDisplayTitle(title);
      }
    };

    updateTitle();
    window.addEventListener('resize', updateTitle);

    return () => window.removeEventListener('resize', updateTitle);
  }, [title]);

  const handleChapterChange = (chapterNum: string) => {
    if (mangaId) {
      router.push(`/reader/${mangaId}/${chapterNum}`);
    }
  };

  // Mobile: Show chapter dropdown in navbar
  if (isMobile) {
    return (
      <div className="reader-mobile-chapter-indicator">
        <ChapterDropdown
          chapters={chapters}
          currentChapter={chapter}
          onChapterChange={handleChapterChange}
        />
      </div>
    );
  }

  // Desktop: Show full title section
  return (
    <div className="reader-title-section">
      <h1 className="reader-manga-title">{displayTitle}</h1>
      <span className="reader-chapter-badge">Chapter {chapter}</span>
    </div>
  );
}
