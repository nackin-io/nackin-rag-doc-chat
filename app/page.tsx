"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropZone } from "@/components/upload/DropZone";
import { DocumentList } from "@/components/documents/DocumentList";
import { ChatInterface } from "@/components/chat/ChatInterface";
import type { Document } from "@/types";

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch {
      // silently fail — will retry on next poll
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (selectedDocId === id) setSelectedDocId(null);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="sm:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
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
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              RAG Document Chat
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Upload PDFs and chat with your documents
            </p>
          </div>
        </div>
        <ThemeToggle />
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
            <p className="px-2 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Documents
            </p>
            <DocumentList
              documents={documents}
              selectedId={selectedDocId}
              onSelect={(id) => {
                setSelectedDocId(id);
                if (window.innerWidth < 640) setSidebarOpen(false);
              }}
              onDelete={handleDelete}
            />
          </div>
        </aside>

        {/* Chat area */}
        <main
          className={`${sidebarOpen ? "hidden sm:flex" : "flex"} flex-1 flex-col`}
        >
          <Card className="flex flex-1 flex-col overflow-hidden rounded-none border-0">
            <ChatInterface selectedDocumentId={selectedDocId} />
          </Card>
        </main>
      </div>
    </div>
  );
}
