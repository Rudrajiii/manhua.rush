"use client";
import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FaGear } from "react-icons/fa6";
import { HiMenu } from "react-icons/hi";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPending, startTransition] = useTransition();
  const settingsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChapterChange = (chapterNum: string) => {
    startTransition(() => {
      router.push(`/reader/${mangaId}/${chapterNum}`);
    });
  };

  const handleBack = () => {
    startTransition(() => {
      router.push(`/collections/all/${mangaSlug}`);
    });
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 10, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 10, 50));

  // Close settings dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    if (showSettings || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings, showMobileMenu]);

  // Apply zoom scale as a CSS variable on the root so other components can use it
  useEffect(() => {
    const varName = '--reader-zoom-scale';
    const value = String(zoom / 100);
    document.documentElement.style.setProperty(varName, value);
    return () => {
      // optional: leave value as-is or reset
    };
  }, [zoom]);

  // Handle keyboard shortcuts for zoom (Ctrl/Cmd + Plus/Minus)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      if (!isCtrlPressed) return;

      // Prevent default browser zoom
      if (event.key === '+' || event.key === '=' || event.key === '-') {
        event.preventDefault();
      }

      if (event.key === '+' || event.key === '=') {
        zoomIn();
      } else if (event.key === '-') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <div className={styles['mobile-menu-wrapper']} ref={mobileMenuRef}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)} 
            className={styles['mobile-menu-btn']}
            title="Menu"
          >
            <HiMenu size={20} />
          </button>
          
          {showMobileMenu && (
            <div className={styles['mobile-menu-dropdown']}>
              <div className={styles['mobile-menu-item']}>
                <span className={styles['mobile-menu-label']}>Chapter</span>
                <select
                  value={currentChapter}
                  onChange={(e) => {
                    handleChapterChange(e.target.value);
                    setShowMobileMenu(false);
                  }}
                  className={styles['mobile-chapter-select']}
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.chapter}>
                      Ch. {ch.chapter}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles['mobile-menu-item']}>
                <span className={styles['mobile-menu-label']}>Zoom</span>
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
              
              <button 
                onClick={() => {
                  handleBack();
                  setShowMobileMenu(false);
                }} 
                className={styles['mobile-back-btn']}
                disabled={isPending}
              >
                {isPending ? (
                  <span className={styles['btn-spinner']} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                )}
                {isPending ? 'Going back…' : 'Back to Manga'}
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

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
      <button onClick={handleBack} className={styles['back-btn']} disabled={isPending}>
        {isPending ? (
          <span className={styles['btn-spinner']} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        )}
        {isPending ? 'Returning…' : 'Back'}
      </button>
      {/* static styles moved to ReaderControls.module.css */}

      {/* zoom applied via --reader-zoom-scale on :root; CSS lives in globals.css */}
    </>
  );
}
