"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { ChunkMatch } from "@/types";

interface SourceCitationsProps {
  sources: ChunkMatch[];
}

interface PopoverProps {
  source: ChunkMatch;
  index: number;
  isOpen: boolean;
  onClose: () => void;
}

function SourcePopover({ source, index, isOpen, onClose }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 z-50 mb-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-xl"
      style={{ maxWidth: "min(320px, calc(100vw - 2rem))" }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">Source {index + 1}</span>
        <span className="text-muted-foreground">{Math.round(source.similarity * 100)}% match</span>
      </div>
      <p className="line-clamp-6 whitespace-pre-wrap leading-relaxed text-muted-foreground">
        {source.content}
      </p>
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Close"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="self-center text-[10px] text-muted-foreground">Sources:</span>
      {sources.map((source, index) => (
        <div key={source.id} className="relative">
          <Badge
            variant="secondary"
            className="cursor-pointer text-[10px] transition-colors hover:bg-accent select-none"
            onClick={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
            role="button"
            aria-expanded={expandedIndex === index}
            aria-label={`Source ${index + 1}, ${Math.round(source.similarity * 100)}% similarity match`}
          >
            [{index + 1}] {Math.round(source.similarity * 100)}%
          </Badge>

          <SourcePopover
            source={source}
            index={index}
            isOpen={expandedIndex === index}
            onClose={() => setExpandedIndex(null)}
          />
        </div>
      ))}
    </div>
  );
}
