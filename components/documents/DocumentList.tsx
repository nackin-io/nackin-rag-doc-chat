"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Document } from "@/types";

interface DocumentListProps {
  documents: Document[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}

function StatusBadge({ status }: { status: Document["status"] }) {
  const variants: Record<Document["status"], "default" | "secondary" | "destructive"> = {
    ready: "default",
    processing: "secondary",
    error: "destructive",
  };

  return (
    <Badge variant={variants[status]} className="text-[10px]">
      {status === "processing" && (
        <span className="mr-1 inline-block h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
      )}
      {status}
    </Badge>
  );
}

export function DocumentList({
  documents,
  selectedId,
  onSelect,
  onDelete,
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="px-2 py-8 text-center text-sm text-muted-foreground">
        No documents yet. Upload a PDF to get started.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-20rem)]">
      <div className="space-y-1 pr-2">
        <button
          onClick={() => onSelect(null)}
          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
            selectedId === null ? "bg-accent font-medium" : ""
          }`}
          aria-label="Chat with all documents"
        >
          All Documents
        </button>

        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`group flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-accent ${
              selectedId === doc.id ? "bg-accent" : ""
            }`}
          >
            <button
              onClick={() => onSelect(doc.id)}
              className="flex min-w-0 flex-1 flex-col gap-1 text-left"
              aria-label={`Select ${doc.name}`}
            >
              <span className="truncate text-sm font-medium">{doc.name}</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={doc.status} />
                {doc.size && (
                  <span className="text-[10px] text-muted-foreground">
                    {(doc.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc.id);
              }}
              aria-label={`Delete ${doc.name}`}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
