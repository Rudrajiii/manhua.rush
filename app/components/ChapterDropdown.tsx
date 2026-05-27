'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import styles from './ChapterDropdown.module.css';

type Chapter = {
  id: string;
  chapter: string;
  title?: string;
};

type Props = {
  chapters: Chapter[];
  currentChapter: string;
  onChapterChange: (chapterNum: string) => void;
};

export default function ChapterDropdown({ chapters, currentChapter, onChapterChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find current chapter object
  const currentChapterObj = chapters.find((ch) => ch.chapter === currentChapter);

  // Filter chapters based on search query
  const filteredChapters = chapters.filter((ch) => {
    const query = searchQuery.toLowerCase();
    return (
      ch.chapter.toLowerCase().includes(query) ||
      (ch.title && ch.title.toLowerCase().includes(query))
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelectChapter = (chapterNum: string) => {
    onChapterChange(chapterNum);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={styles['chapter-dropdown-wrapper']} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles['dropdown-button']}
        title="Select Chapter"
      >
        <span className={styles['dropdown-button-text']}>
          Ch. {currentChapterObj?.chapter || currentChapter}
        </span>
        <ChevronDown
          size={16}
          className={`${styles['dropdown-icon']} ${isOpen ? styles['icon-open'] : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles['dropdown-menu']}>
          {/* Search Input */}
          <div className={styles['dropdown-search-wrapper']}>
            <Search size={14} className={styles['search-icon']} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles['dropdown-search-input']}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles['search-clear-btn']}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Chapters List */}
          <div className={styles['dropdown-list']}>
            {filteredChapters.length > 0 ? (
              filteredChapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter(ch.chapter)}
                  className={`${styles['dropdown-item']} ${
                    currentChapter === ch.chapter ? styles['item-active'] : ''
                  }`}
                >
                  <div className={styles['item-chapter']}>Ch. {ch.chapter}</div>
                  {ch.title && <div className={styles['item-title']}>{ch.title}</div>}
                </button>
              ))
            ) : (
              <div className={styles['dropdown-empty']}>No chapters found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
