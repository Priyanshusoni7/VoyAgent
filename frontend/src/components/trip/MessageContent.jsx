"use client";

import React from "react";

// Lightweight inline formatter — **bold**, _italic_, `code`.
// Deliberately tiny: the assistant only ever sends these three, so pulling in a
// full markdown dependency would be overkill.
function renderInline(text, keyPrefix) {
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;
  const parts = String(text).split(pattern).filter(Boolean);

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key} className="font-semibold">{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={key} className="opacity-70">{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="px-1 py-0.5 rounded bg-black/5 text-[0.9em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

/**
 * Renders an assistant/user message, preserving the line breaks and bullet
 * lists the AI service sends. Without this, multi-line clarification questions
 * collapse into one unreadable run-on line.
 */
export default function MessageContent({ content, tone = "assistant" }) {
  const lines = String(content ?? "").split("\n");
  const bulletColor = tone === "user" ? "text-white/70" : "text-[#d4603a]";

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Blank line → paragraph spacing
        if (!trimmed) {
          return <div key={idx} className="h-2" aria-hidden="true" />;
        }

        // Bullet line
        const bullet = trimmed.match(/^[•\-*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={idx} className="flex gap-2 pl-0.5">
              <span className={`${bulletColor} shrink-0 leading-relaxed`}>•</span>
              <span className="leading-relaxed">{renderInline(bullet[1], idx)}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(trimmed, idx)}
          </p>
        );
      })}
    </div>
  );
}
