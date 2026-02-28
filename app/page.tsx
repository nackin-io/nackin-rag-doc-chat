"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropZone } from "@/components/upload/DropZone";
import { DocumentList } from "@/components/documents/DocumentList";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types";

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) ?? null;

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data: Document[] = await res.json();
        setDocuments(data);
      }
    } catch {
      // silently fail — will retry on next poll
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  // Smart polling: only poll while there are processing documents
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(() => void fetchDocuments(), 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleDelete = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    setDeleteConfirm({ id, name: doc.name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    setDeleteConfirm(null);

    // Capture doc before optimistic update for potential revert
    const doc = documents.find((d) => d.id === id);

    // Optimistic update
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDocId === id) setSelectedDocId(null);

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      toast.success(`Deleted "${name}"`, { duration: 3000 });
    } catch (err) {
      // Revert optimistic update
      if (doc) {
        setDocuments((prev) => {
          const exists = prev.some((d) => d.id === id);
          return exists ? prev : [doc, ...prev];
        });
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const handleSelectDoc = (id: string | null) => {
    setSelectedDocId(id);
    if (window.innerWidth < 640) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-1 hover:bg-muted transition-colors sm:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight leading-tight">
                RAG Document Chat
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block leading-tight">
                AI-powered document intelligence
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {documents.filter(d => d.status === "ready").length} doc{documents.filter(d => d.status === "ready").length !== 1 ? "s" : ""} ready
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "flex" : "hidden"
          } w-full flex-col border-r sm:flex sm:w-72 lg:w-80`}
        >
          <div className="p-4">
            <DropZone onUploadComplete={fetchDocuments} />
          </div>
          <Separator />
          <div className="flex-1 overflow-hidden p-2">
            <div className="flex items-center justify-between px-2 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documents
              </p>
              {documents.length > 0 && (
                <span className="text-xs text-muted-foreground">{documents.length}</span>
              )}
            </div>
            <DocumentList
              documents={documents}
              selectedId={selectedDocId}
              onSelect={handleSelectDoc}
              onDelete={handleDelete}
              isLoading={docsLoading}
            />
          </div>
        </aside>

        {/* Chat area */}
        <main
          className={`${sidebarOpen ? "hidden sm:flex" : "flex"} flex-1 flex-col overflow-hidden`}
        >
          <Card className="flex flex-1 flex-col overflow-hidden rounded-none border-0 shadow-none">
            <ChatInterface
              selectedDocumentId={selectedDocId}
              selectedDocumentName={selectedDoc?.name ?? null}
            />
          </Card>
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              <span>
                Are you sure you want to delete{" "}
                <strong className="text-foreground">{deleteConfirm?.name}</strong>? This action
                cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
