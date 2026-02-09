'use client';

import { useEffect, useState, useRef } from 'react';
import { FaEye } from 'react-icons/fa';

interface ViewCounterProps {
  slug: string;
}

export default function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent double tracking in React StrictMode (development)
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackView = async () => {
      try {
        // First, try to track the view (will only increment if not viewed recently)
        const trackResponse = await fetch('/api/track-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug }),
        });

        if (trackResponse.ok) {
          const data = await trackResponse.json();
          setViews(data.views);
        } else {
          // Fallback: just get the view count without tracking
          const getResponse = await fetch(`/api/track-views?slug=${slug}`);
          if (getResponse.ok) {
            const data = await getResponse.json();
            setViews(data.views);
          }
        }
      } catch (error) {
        console.error('Error tracking view:', error);
        // Even on error, try to get the count
        try {
          const getResponse = await fetch(`/api/track-views?slug=${slug}`);
          if (getResponse.ok) {
            const data = await getResponse.json();
            setViews(data.views);
          }
        } catch (err) {
          console.error('Error fetching views:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    trackView();
  }, [slug]);

  if (loading) {
    return (
      <div className="view-counter" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        <FaEye style={{ fontSize: '16px' }} />
        <span>...</span>
      </div>
    );
  }

  return (
    <div className="view-counter" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '6px',
      color: '#a78bfa',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      <FaEye style={{ fontSize: '16px' }} />
      <span>{views !== null ? views.toLocaleString() : '0'} views</span>
    </div>
  );
}
