"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ChunkMatch } from "@/types";

interface SourceCitationsProps {
  sources: ChunkMatch[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((source, index) => (
        <div key={source.id} className="relative">
          <Badge
            variant="secondary"
            className="cursor-pointer text-[10px] transition-colors hover:bg-accent"
            onClick={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
            role="button"
            aria-expanded={expandedIndex === index}
            aria-label={`Source ${index + 1}, similarity ${Math.round(source.similarity * 100)}%`}
          >
            [{index + 1}] {Math.round(source.similarity * 100)}% match
          </Badge>

          {expandedIndex === index && (
            <div className="absolute bottom-full left-0 z-10 mb-2 w-72 rounded-md border bg-popover p-3 text-xs text-popover-foreground shadow-lg sm:w-96">
              <p className="line-clamp-6 whitespace-pre-wrap">{source.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
