"use client";
import React, { useState, useEffect, useRef } from "react";
import ChapterNavigation from "./ChapterNavigation";

type Chapter = {
  id: string;
  chapter: string;
  title: string;
};

type Props = {
  imageUrls: string[];
  isCloud?: boolean;
  currentChapter?: string;
  chapters?: Chapter[];
  mangaId?: string;
};

/** How many panels to render eagerly on first visit (no observer needed). */
const EAGER_COUNT = 3;

type PanelState = "pending" | "loading" | "loaded" | "error";

/**
 * Single panel with 4 exclusive states:
 *   pending  → grey placeholder (waiting for scroll)
 *   loading  → centered spinner (image downloading in background via JS Image)
 *   loaded   → the actual <img>
 *   error    → error message + retry button
 *
 * Only ONE element is in the DOM at a time so there are no layout conflicts.
 */
function LazyPanel({
  src,
  index,
  isCloud,
  scrollRoot,
  eager,
}: {
  src: string;
  index: number;
  isCloud: boolean;
  scrollRoot: Element | null;
  eager: boolean;
}) {
  const [state, setState] = useState<PanelState>(eager ? "loading" : "pending");
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Observer: transition pending → loading when near the scroll viewport ── */
  useEffect(() => {
    if (state !== "pending") return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("loading");
          observer.unobserve(el);
        }
      },
      {
        root: scrollRoot, // the actual scrollable container, NOT the viewport
        rootMargin: "600px 0px",
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [state, scrollRoot]);

  /* ── Preload: download the image in JS, then flip to "loaded" ── */
  useEffect(() => {
    if (state !== "loading") return;
    const img = new window.Image();
    img.onload = () => setState("loaded");
    img.onerror = () => setState("error");
    img.src = src;
    // If the image is already cached the callbacks fire synchronously/next‑tick
  }, [state, src]);

  return (
    <div ref={containerRef} className="reader-panel-container">
      {/* ---- Pending: placeholder so the observer has geometry to track ---- */}
      {state === "pending" && <div className="panel-placeholder" />}

      {/* ---- Loading: centered spinner ---- */}
      {state === "loading" && (
        <div className="panel-spinner">
          <div className="panel-spinner-ring" />
          <span className="panel-spinner-text">Panel {index + 1}</span>
        </div>
      )}

      {/* ---- Loaded: the actual image (served from browser cache) ---- */}
      {state === "loaded" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`page-${index + 1}`}
          className="reader-panel-img"
          draggable={false}
          {...(isCloud
            ? { onContextMenu: (e: React.MouseEvent) => e.preventDefault() }
            : {})}
        />
      )}

      {/* ---- Error: message + retry ---- */}
      {state === "error" && (
        <div className="panel-error">
          <span>Failed to load panel {index + 1}</span>
          <button
            className="panel-retry-btn"
            onClick={() => setState("loading")}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReaderPanels({ 
  imageUrls, 
  isCloud = false,
  currentChapter,
  chapters,
  mangaId
}: Props) {
  const panelsRef = useRef<HTMLDivElement>(null);
  const [scrollRoot, setScrollRoot] = useState<Element | null>(null);

  /*
   * Resolve the scroll container: the parent of .reader-panels is
   * .reader-panels-wrapper (overflow-y: auto) — that's what the user
   * actually scrolls. We need it as the IntersectionObserver root so
   * "in view" means "scrolled into the visible part of the reader pane",
   * not "inside the browser viewport" (which would be everything at once).
   */
  useEffect(() => {
    const el = panelsRef.current?.parentElement;
    if (el) setScrollRoot(el);
  }, []);

  if (imageUrls.length === 0) {
    return (
      <div className="reader-panels" ref={panelsRef}>
        <div className="reader-empty">No images found for this chapter.</div>
      </div>
    );
  }

  return (
    <div className="reader-panels" ref={panelsRef}>
      {imageUrls.map((src, idx) => (
        <LazyPanel
          key={`${idx}-${src}`}
          src={src}
          index={idx}
          isCloud={isCloud}
          scrollRoot={scrollRoot}
          eager={idx < EAGER_COUNT}
        />
      ))}
      {currentChapter && chapters && mangaId && (
        <ChapterNavigation
          currentChapter={currentChapter}
          chapters={chapters}
          mangaId={mangaId}
        />
      )}
    </div>
  );
}