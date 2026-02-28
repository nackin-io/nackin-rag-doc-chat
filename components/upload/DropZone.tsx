"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DropZoneProps {
  onUploadComplete: () => void;
}

export function DropZone({ onUploadComplete }: DropZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

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
        toast.success(`"${file.name}" uploaded — processing chunks…`, { duration: 4000 });
        onUploadComplete();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        toast.error(msg);
      } finally {
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 800);
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
        toast.error("File size must be under 10MB");
      } else if (rejection?.errors[0]?.code === "file-invalid-type") {
        toast.error("Only PDF files are accepted");
      } else {
        toast.error("Invalid file");
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 select-none",
        "hover:border-primary/50 hover:bg-primary/5",
        isDragActive && "border-primary bg-primary/10 scale-[1.01]",
        uploading && "pointer-events-none opacity-70",
        !isDragActive && !uploading && "border-muted-foreground/25"
      )}
      role="button"
      aria-label="Upload PDF — drag and drop or click to browse"
    >
      <input {...getInputProps()} aria-label="Upload PDF file" />

      {uploading ? (
        <div className="space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          <p className="text-sm font-medium">Uploading…</p>
          <div className="mx-auto h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className={cn(
              "mx-auto flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              isDragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? "Drop your PDF here" : "Drop PDF or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">PDF only · max 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
