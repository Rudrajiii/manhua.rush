"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaGear } from "react-icons/fa6";
import styles from './ReaderControls.module.css';


type Chapter = {
  id: string;
  chapter: string;
  title: string;
};

type Props = {
  mangaId: string;
  currentChapter: string;
  chapters: Chapter[];
  mangaTitle: string;
  mangaSlug: string;
};

export default function ReaderControls({ mangaId, currentChapter, chapters, mangaTitle, mangaSlug }: Props) {
  const router = useRouter();
  const [zoom, setZoom] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const handleChapterChange = (chapterNum: string) => {
    router.push(`/reader/${mangaId}/${chapterNum}`);
  };

  const handleBack = () => {
    router.push(`/collections/all/${mangaSlug}`);
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 10, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 10, 50));

  // Close settings dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Apply zoom scale as a CSS variable on the root so other components can use it
  useEffect(() => {
    const varName = '--reader-zoom-scale';
    const value = String(zoom / 100);
    document.documentElement.style.setProperty(varName, value);
    return () => {
      // optional: leave value as-is or reset
    };
  }, [zoom]);

  return (
    <>
      {/* Chapter Dropdown */}
      <div className={styles['reader-controls-chapter']}>
        <select
          value={currentChapter}
          onChange={(e) => handleChapterChange(e.target.value)}
          className={styles['chapter-dropdown']}
        >
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.chapter}>
              Ch. {ch.chapter}
            </option>
          ))}
        </select>
      </div>

      {/* Settings Button with Zoom Controls */}
      <div className={styles['settings-menu-wrapper']} ref={settingsRef}>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className={styles['settings-btn']}
          title="Settings"
        >
          <FaGear/>
        </button>
        
        {showSettings && (
          <div className={styles['settings-dropdown']}>
            <div className={styles['settings-item']}>
              <span className={styles['settings-label']}>Zoom</span>
              <div className={styles['zoom-controls']}>
                <button onClick={zoomOut} className={styles['zoom-btn-small']} title="Zoom Out">
                  −
                </button>
                <span className={styles['zoom-level-small']}>{zoom}%</span>
                <button onClick={zoomIn} className={styles['zoom-btn-small']} title="Zoom In">
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back Button with Icon */}
      <button onClick={handleBack} className={styles['back-btn']}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      {/* static styles moved to ReaderControls.module.css */}

      {/* zoom applied via --reader-zoom-scale on :root; CSS lives in globals.css */}
    </>
  );
}
