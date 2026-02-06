"use client";
import React, { useState, useEffect } from 'react';

type Props = {
  imageUrls: string[];
};

export default function ReaderPanels({ imageUrls }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (imageUrls.length === 0) {
      setIsLoading(false);
      return;
    }

    // Preload first image
    const img = new Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => setIsLoading(false);
    img.src = imageUrls[0];

    // Fallback timeout
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [imageUrls]);

  if (imageUrls.length === 0) {
    return (
      <div className="reader-panels">
        <div className="reader-empty">No images found for this chapter.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="reader-panels">
        <div className="reader-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p className="loading-text">Loading panels...</p>
        </div>

        <style jsx>{
          `
          .reader-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            gap: 32px;
          }

          .loading-spinner {
            position: relative;
            width: 80px;
            height: 80px;
          }

          .spinner-ring {
            position: absolute;
            border-radius: 50%;
            border: 2px solid transparent;
            animation: spin 2s linear infinite;
          }

          .spinner-ring:nth-child(1) {
            width: 100%;
            height: 100%;
            border-top-color: rgba(139, 92, 246, 0.8);
            border-right-color: rgba(139, 92, 246, 0.2);
          }

          .spinner-ring:nth-child(2) {
            width: 75%;
            height: 75%;
            top: 12.5%;
            left: 12.5%;
            border-top-color: rgba(167, 139, 250, 0.6);
            border-left-color: rgba(167, 139, 250, 0.2);
            animation-duration: 1.5s;
            animation-direction: reverse;
          }

          .spinner-ring:nth-child(3) {
            width: 50%;
            height: 50%;
            top: 25%;
            left: 25%;
            border-top-color: rgba(196, 181, 253, 0.5);
            animation-duration: 1s;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-text {
            color: rgba(255, 255, 255, 0.8);
            font-size: 18px;
            font-weight: 500;
            letter-spacing: 0.5px;
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          `
   } </style>
      </div>
    );
  }

  return (
    <div className="reader-panels">
      {imageUrls.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt={`page-${idx + 1}`} className="reader-panel-img" />
      ))}
    </div>
  );
}