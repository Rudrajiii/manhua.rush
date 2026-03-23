'use client';

import { useState, useEffect } from 'react';

interface ReaderTitleProps {
  title: string;
  chapter: string;
  maxChapter?: number;
}

export default function ReaderTitle({ title, chapter, maxChapter }: ReaderTitleProps) {
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

  // Mobile: Show only chapter progress indicator
  if (isMobile) {
    const chapterNum = parseInt(chapter) || 0;
    // Always use the max chapter number as total
    const total = maxChapter || 1;
    
    return (
      <div className="reader-mobile-chapter-indicator">
        {chapterNum} / {total}
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
