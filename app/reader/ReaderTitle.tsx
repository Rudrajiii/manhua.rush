'use client';

import { useState, useEffect } from 'react';

interface ReaderTitleProps {
  title: string;
  chapter: string;
}

export default function ReaderTitle({ title, chapter }: ReaderTitleProps) {
  const [displayTitle, setDisplayTitle] = useState(title);

  useEffect(() => {
    const updateTitle = () => {
      const width = window.innerWidth;
      
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

  return (
    <div className="reader-title-section">
      <h1 className="reader-manga-title">{displayTitle}</h1>
      <span className="reader-chapter-badge">Chapter {chapter}</span>
    </div>
  );
}
