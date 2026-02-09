'use client';

import { useState, useEffect, useRef } from 'react';
import UsernameModal from './UsernameModal';

export default function UserButton() {
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if username exists in localStorage
    const storedUsername = localStorage.getItem('manhuarush_username');
    const storedUserId = localStorage.getItem('manhuarush_userId');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
    const handleExternalChange = (e: any) => {
      if (e?.detail?.username) {
        setUsername(e.detail.username);
        setUserId(e.detail.userId || null);
      }
    };

    window.addEventListener('manhuarush:username-changed', handleExternalChange as EventListener);

    return () => window.removeEventListener('manhuarush:username-changed', handleExternalChange as EventListener);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSuccess = (newUsername: string, newUserId: string) => {
    setUsername(newUsername);
    setUserId(newUserId);
  };

  const handleButtonClick = () => {
    if (username) {
      setShowDropdown(!showDropdown);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleUpdateUsername = () => {
    setShowDropdown(false);
    setIsModalOpen(true);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        className="nav-link"
        style={{ background: 'rgba(167,139,250,0.12)', border: 'none', cursor: 'pointer' }}
        onClick={handleButtonClick}
      >
        {username == null ? `Set Username` : `Hey💜 ${username}` || 'Set Username'}
      </button>

      {showDropdown && username && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: '#1a1a2e',
            border: 'none',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '180px',
            zIndex: 1000
          }}
        >
          <button
            onClick={handleUpdateUsername}
            style={{
              width: '100%',
              padding: '2px',
              background: 'transparent',
              border: 'none',
              color: '#a78bfa',
              cursor: 'pointer',
              textAlign:'center',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(167,139,250,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Update Username
          </button>
        </div>
      )}

      <UsernameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        currentUsername={username || undefined}
        currentUserId={userId || undefined}
      />
    </div>
  );
}
