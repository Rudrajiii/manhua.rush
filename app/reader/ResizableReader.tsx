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
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (isMobile) {
    return (
      <div className={styles['reader-main']} ref={containerRef}>
        {/* Mobile Toggle Button */}
        <button
          className={styles['mobile-toggle-btn']}
          onClick={() => setShowComments(!showComments)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span>{showComments ? 'Reader' : 'Comments'}</span>
        </button>

        {/* Panels or Comments based on toggle */}
        {!showComments ? (
          <div className={styles['reader-panels-wrapper-mobile']}>
            {panels}
          </div>
        ) : (
          <div className={styles['reader-sidebar-mobile']}>
            {sidebar}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles['reader-main']} ref={containerRef}>
      {/* Left: Scrollable Panels */}
      <div className={styles['reader-panels-wrapper']} style={{ width: `${panelWidth}%` }}>
        {panels}
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
