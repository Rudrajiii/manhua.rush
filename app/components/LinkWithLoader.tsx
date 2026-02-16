"use client";
import React, { useState, useTransition, MouseEvent } from "react";
import { useRouter } from "next/navigation";

interface LinkWithLoaderProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  /** Text shown while loading (replaces children) */
  loadingText?: string;
  /** If true, show inline spinner before children instead of replacing them */
  inlineSpinner?: boolean;
}

/**
 * Client link that wraps router.push in useTransition for instant feedback.
 * Shows a small spinner while the destination page is loading.
 */
export default function LinkWithLoader({
  href,
  className,
  style,
  children,
  loadingText,
  inlineSpinner = false,
}: LinkWithLoaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={{
        ...style,
        opacity: isPending ? 0.85 : 1,
        pointerEvents: isPending ? "none" : "auto",
      }}
    >
      {isPending ? (
        <>
          <span className="link-spinner" aria-hidden="true" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </a>
  );
}
