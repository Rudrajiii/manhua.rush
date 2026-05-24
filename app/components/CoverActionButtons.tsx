'use client';

import React from 'react';
import { FaBell, FaPlay } from 'react-icons/fa';
import { toast } from 'sonner';

interface CoverActionButtonsProps {
  mangadexId?: string;
  firstChapterNumber?: string;
  seriesTitle?: string;
}

export default function CoverActionButtons({
  mangadexId,
  firstChapterNumber,
  seriesTitle,
}: CoverActionButtonsProps) {
  const handleNotification = () => {
    toast.success(`Notifications enabled for ${seriesTitle}!`);
  };

  const handleResume = () => {
    if (mangadexId && firstChapterNumber) {
      window.location.href = `/reader/${mangadexId}/${firstChapterNumber}`;
    }
  };

  // Always render container
  return (
    <div 
      className="cover-action-buttons"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
      }}
    >
      {mangadexId && firstChapterNumber ? (
        <>
          <button
            onClick={handleResume}
            className="btn-resume"
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 16px',
              height: '48px',
              background: '#8765EB',
              color: '#1C1C1C',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.5s ease',
              position: 'relative',
            }}
          >
            <FaPlay size={14} />
            Resume Ch. {firstChapterNumber}
          </button>
          <button
            className="btn-notification"
            onClick={handleNotification}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 16px',
              height: '48px',
              background: '#1F1F1F',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.5s ease',
              position: 'relative',
            }}
          >
            <FaBell size={14} />
            Get Notification
          </button>
        </>
      ) : null}
    </div>
  );
}

