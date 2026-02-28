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
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: Document["status"] }) {
  const variants: Record<Document["status"], "default" | "secondary" | "destructive"> = {
    ready: "default",
    processing: "secondary",
    error: "destructive",
  };

  const labels: Record<Document["status"], string> = {
    ready: "Ready",
    processing: "Processing…",
    error: "Error",
  };

  return (
    <Badge variant={variants[status]} className="text-[10px] gap-1">
      {status === "processing" && (
        <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-current" />
      )}
      {labels[status]}
    </Badge>
  );
}

function DocumentSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md px-3 py-2 animate-pulse"
        >
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  documents,
  selectedId,
  onSelect,
  onDelete,
  isLoading = false,
}: DocumentListProps) {
  if (isLoading) {
    return <DocumentSkeleton />;
  }

  if (documents.length === 0) {
    return (
      <div className="px-2 py-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Upload a PDF above to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-22rem)]">
      <div className="space-y-1 pr-2">
        <button
          onClick={() => onSelect(null)}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
            selectedId === null ? "bg-accent font-medium" : ""
          }`}
          aria-label="Chat with all documents"
          aria-pressed={selectedId === null}
        >
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>All Documents</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{documents.filter(d => d.status === "ready").length}</span>
          </div>
        </button>

        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`group flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-accent ${
              selectedId === doc.id ? "bg-accent" : ""
            }`}
          >
            <button
              onClick={() => onSelect(doc.id)}
              className="flex min-w-0 flex-1 flex-col gap-1 text-left"
              aria-label={`Select document: ${doc.name}`}
              aria-pressed={selectedId === doc.id}
            >
              <span className="truncate text-sm font-medium leading-snug">{doc.name}</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={doc.status} />
                {doc.size != null && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(doc.size)}
                  </span>
                )}
              </div>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc.id);
              }}
              aria-label={`Delete ${doc.name}`}
              disabled={doc.status === "processing"}
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
