'use client';

import { useState, useEffect } from 'react';
import styles from './UsernameModal.module.css';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string, userId: string) => void;
  currentUsername?: string;
  currentUserId?: string;
}

export default function UsernameModal({ isOpen, onClose, onSuccess, currentUsername, currentUserId }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const trimmed = username.trim();
  const isValid = trimmed.length >= 4 && trimmed.length <= 12;
  const isUpdateMode = !!currentUsername && !!currentUserId;

  useEffect(() => {
    if (isOpen) {
      if (currentUsername) {
        setUsername(currentUsername);
      } else {
        setUsername('');
      }
      setError('');
    }
  }, [isOpen, currentUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const name = username.trim();
    if (name.length < 4 || name.length > 12) {
      setError('Username must be between 4 and 12 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: isUpdateMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isUpdateMode
            ? { userId: currentUserId, newUsername: name }
            : { username: name }
        ),
      });

      const data = await response.json();

      if (response.ok) {
        // Store in localStorage
        localStorage.setItem('manhuarush_username', data.user.username);
        localStorage.setItem('manhuarush_userId', data.user.id);
        if (data.user.isAdmin) {
          localStorage.setItem('manhuarush_isAdmin', 'true');
        } else {
          localStorage.removeItem('manhuarush_isAdmin');
        }
        onSuccess(data.user.username, data.user.id);
        onClose();
      } else {
        setError(data.error || `Failed to ${isUpdateMode ? 'update' : 'register'} username`);
      }
    } catch (err) {
      setError(`Failed to ${isUpdateMode ? 'update' : 'register'} username. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <h2 className={styles.modalTitle}>{isUpdateMode ? 'Update Username' : 'Set Username'}</h2>
        <p className={styles.modalDescription}>
          {isUpdateMode
            ? 'Change your username to a new unique one'
            : 'Make a unique username to interact with the community'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (4-12 characters)"
              maxLength={12}
              className={styles.input}
              disabled={loading}
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !isValid}
            >
              {loading
                ? isUpdateMode
                  ? 'Updating...'
                  : 'Creating...'
                : isUpdateMode
                ? 'Update Username'
                : 'Create Username'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
