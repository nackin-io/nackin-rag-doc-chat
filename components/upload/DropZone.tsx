"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onUploadComplete: () => void;
}

export function DropZone({ onUploadComplete }: DropZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setUploading(true);
      setProgress(10);

      try {
        const formData = new FormData();
        formData.append("file", file);

        setProgress(30);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        setProgress(70);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        setProgress(100);
        onUploadComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 1000);
      }
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection?.errors[0]?.code === "file-too-large") {
        setError("File size must be under 10MB");
      } else if (rejection?.errors[0]?.code === "file-invalid-type") {
        setError("Only PDF files are accepted");
      } else {
        setError("Invalid file");
      }
    },
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative cursor-pointer border-2 border-dashed p-6 text-center transition-colors",
        isDragActive && "border-primary bg-primary/5",
        uploading && "pointer-events-none opacity-60",
        error && "border-destructive"
      )}
    >
      <input {...getInputProps()} aria-label="Upload PDF file" />

      {uploading ? (
        <div className="space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
          <p className="text-sm text-muted-foreground">Processing PDF...</p>
          <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-sm font-medium">
            {isDragActive ? "Drop your PDF here" : "Drag & drop a PDF, or click to select"}
          </p>
          <p className="text-xs text-muted-foreground">PDF only, max 10MB</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
