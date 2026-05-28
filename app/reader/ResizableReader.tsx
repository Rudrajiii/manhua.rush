"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './ResizableReader.module.css';

type Props = {
  panels: React.ReactNode;
  sidebar: React.ReactNode;
};

export default function ResizableReader({ panels, sidebar }: Props) {
  const [panelWidth, setPanelWidth] = useState(65); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollMode, setScrollMode] = useState<'top' | 'bottom'>('bottom'); // Track if should scroll to top or bottom
  const containerRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = () => {
    if (!isMobile) {
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const offsetX = e.clientX - containerRect.left;
      const newWidth = (offsetX / containerRect.width) * 100;

      // Clamp between 30% and 80%
      setPanelWidth(Math.min(Math.max(newWidth, 30), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleScrollToggle = () => {
    if (!panelsRef.current) return;

    if (scrollMode === 'bottom') {
      // Scroll to bottom
      panelsRef.current.scrollTo({
        top: panelsRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setScrollMode('top');
    } else {
      // Scroll to top
      panelsRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setScrollMode('bottom');
    }
  };

  const handleMobileScrollToggle = () => {
    if (!mobileScrollRef.current) return;

    if (scrollMode === 'bottom') {
      // Scroll to bottom
      mobileScrollRef.current.scrollTo({
        top: mobileScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setScrollMode('top');
    } else {
      // Scroll to top
      mobileScrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setScrollMode('bottom');
    }
  };

  if (isMobile) {
    return (
      <div className={styles['reader-main-mobile']} ref={mobileScrollRef}>
        {/* Panels */}
        <div 
          className={styles['reader-panels-wrapper-mobile']}
        >
          {panels}
        </div>
        
        {/* Comments below panels */}
        <div className={styles['reader-sidebar-mobile']}>
          {sidebar}
        </div>

        {/* Scroll Toggle Button - Bottom Right Corner (Mobile) */}
        <button
          className={styles['scroll-toggle-btn-mobile']}
          onClick={handleMobileScrollToggle}
          title={scrollMode === 'bottom' ? 'Scroll to Bottom' : 'Scroll to Top'}
          aria-label={scrollMode === 'bottom' ? 'Scroll to Bottom' : 'Scroll to Top'}
        >
          {scrollMode === 'bottom' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={styles['reader-main']} ref={containerRef}>
      {/* Left: Scrollable Panels */}
      <div 
        className={styles['reader-panels-wrapper']} 
        style={{ width: `${panelWidth}%` }}
        ref={panelsRef}
      >
        {panels}

        {/* Scroll Toggle Button - Bottom Right Corner */}
        <button
          className={styles['scroll-toggle-btn']}
          onClick={handleScrollToggle}
          title={scrollMode === 'bottom' ? 'Scroll to Bottom' : 'Scroll to Top'}
          aria-label={scrollMode === 'bottom' ? 'Scroll to Bottom' : 'Scroll to Top'}
        >
          {scrollMode === 'bottom' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          )}
        </button>
      </div>

      {/* Resizer Handle */}
      <div
        className={`${styles['resizer-handle']} ${isDragging ? styles['dragging'] : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className={styles['resizer-line']} />
      </div>

      {/* Right: Comment Section */}
      <div className={styles['reader-sidebar']} style={{ width: `${100 - panelWidth}%` }}>
        {sidebar}
      </div>

      <style jsx>{
        `
        /* Custom scrollbars for reader panels and sidebar */
        .${styles['reader-panels-wrapper']}::-webkit-scrollbar,
        .${styles['reader-sidebar']}::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
        }

        .${styles['reader-panels-wrapper']}::-webkit-scrollbar-track,
        .${styles['reader-sidebar']}::-webkit-scrollbar-track {
          background: transparent !important;
        }

        .${styles['reader-panels-wrapper']}::-webkit-scrollbar-thumb,
        .${styles['reader-sidebar']}::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.6) !important;
          border-radius: 3px !important;
          border: none !important;
          margin: 2px !important;
        }

        .${styles['reader-panels-wrapper']}::-webkit-scrollbar-thumb:hover,
        .${styles['reader-sidebar']}::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8) !important;
        }

        .${styles['reader-panels-wrapper']}::-webkit-scrollbar-corner,
        .${styles['reader-sidebar']}::-webkit-scrollbar-corner {
          background: transparent !important;
          display: none !important;
        }

        .${styles['reader-panels-wrapper']}::-webkit-scrollbar-button,
        .${styles['reader-sidebar']}::-webkit-scrollbar-button {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }

        .${styles['reader-panels-wrapper']}::-webkit-scrollbar-button:start:decrement,
        .${styles['reader-panels-wrapper']}::-webkit-scrollbar-button:end:increment,
        .${styles['reader-sidebar']}::-webkit-scrollbar-button:start:decrement,
        .${styles['reader-sidebar']}::-webkit-scrollbar-button:end:increment {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        .${styles['reader-panels-wrapper']},
        .${styles['reader-sidebar']} {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(139, 92, 246, 0.6) transparent !important;
        }
        `
      }</style>
    </div>
  );
}
