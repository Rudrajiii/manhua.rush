'use client';

import { useEffect } from 'react';
import styles from './AlertNotification.module.css';

interface AlertNotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export default function AlertNotification({ message, onClose, duration = 4000, actionLabel, onAction }: AlertNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={styles.alertContainer}>
      <div className={styles.alertContent}>
        <span style={{flex: 1}}>{message}</span>
        {actionLabel && onAction && (
          <button className={styles.actionButton} onClick={() => { onAction(); onClose(); }}>
            {actionLabel}
          </button>
        )}
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
    </div>
  );
}
