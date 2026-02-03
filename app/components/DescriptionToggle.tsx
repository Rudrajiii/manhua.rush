"use client";
import React, { useState } from "react";

type Props = {
  text: string;
  maxChars?: number;
};

export default function DescriptionToggle({ text, maxChars = 200 }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const shouldTruncate = text.length > maxChars;
  const short = shouldTruncate ? text.slice(0, maxChars).trimEnd() : text;

  return (
    <div className="manga-desc">
      <p style={{ margin: 0, color: "#d1d5db", whiteSpace: "pre-wrap" }}>
        {expanded ? text : shouldTruncate ? short + "..." : text}
      </p>

      {shouldTruncate && (
        <button
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            padding: 0,
            marginTop: 8,
            fontSize: 16,
          }}
        >
          {expanded ? "Show less" : "⋯"}
        </button>
      )}
    </div>
  );
}
