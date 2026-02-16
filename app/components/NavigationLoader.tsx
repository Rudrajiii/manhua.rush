"use client";
import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Drop-in replacement for router.push with instant loading feedback.
 * Returns [navigate, isPending] — isPending is true while the route is loading.
 */
export function useNavigate() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  return { navigate, isPending };
}

/**
 * Full-page top loading bar that shows during Next.js navigations.
 * Placed once in the root layout.
 */
export function NavigationLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for route change events via a MutationObserver on <html>
    // When Next.js navigates, it adds/removes attributes. We use a simple
    // approach: detect pending via custom event.
    const start = () => setLoading(true);
    const end = () => setLoading(false);

    window.addEventListener("nav:start", start);
    window.addEventListener("nav:end", end);

    return () => {
      window.removeEventListener("nav:start", start);
      window.removeEventListener("nav:end", end);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="nav-loading-bar" aria-hidden="true">
      <div className="nav-loading-bar-inner" />
    </div>
  );
}
