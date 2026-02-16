"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";

/**
 * YouTube-style top loading bar (purple gradient).
 * Detects navigation start by intercepting <a> clicks,
 * detects navigation end via usePathname() change.
 */
function TopLoaderInner() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef(pathname);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  // When pathname changes → navigation completed
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;

      if (loading) {
        cleanup();
        setProgress(100);

        fadeTimerRef.current = setTimeout(() => {
          setLoading(false);
          setVisible(false);
          setProgress(0);
        }, 350);
      }
    }
  }, [pathname, loading, cleanup]);

  // Intercept all <a> clicks to detect navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, mailto, new-tab links
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        anchor.target === "_blank"
      )
        return;

      // Skip same page
      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname && url.search === window.location.search)
        return;

      // Start the loading bar
      cleanup();
      setLoading(true);
      setVisible(true);
      setProgress(15);

      let p = 15;
      intervalRef.current = setInterval(() => {
        p += Math.random() * 8 + 2;
        if (p > 90) {
          p = 90;
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        setProgress(p);
      }, 350);
    };

    document.addEventListener("click", handleClick, true); // capture phase
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  if (!visible) return null;

  return (
    <div className="top-loader" aria-hidden="true">
      <div
        className="top-loader-bar"
        style={{
          width: `${progress}%`,
          transition:
            progress >= 100
              ? "width 200ms ease-out, opacity 350ms ease-out 150ms"
              : "width 350ms ease-out",
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

export default function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}
