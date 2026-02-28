import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { DropZone } from "@/components/upload/DropZone";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

function createPdfFile(name = "test.pdf", size = 1024) {
  return new File(["pdf content"], name, { type: "application/pdf", lastModified: Date.now() });
}

describe("DropZone", () => {
  const onUploadComplete = vi.fn();

  beforeEach(() => {
    onUploadComplete.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders upload prompt", () => {
    render(<DropZone onUploadComplete={onUploadComplete} />);
    expect(screen.getByText(/drop pdf or click to upload/i)).toBeInTheDocument();
  });

  it("shows PDF size limit hint", () => {
    render(<DropZone onUploadComplete={onUploadComplete} />);
    expect(screen.getByText(/max 10mb/i)).toBeInTheDocument();
  });

  it("calls fetch with FormData on file drop", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ documentId: "doc-123", status: "processing" }), {
        status: 200,
      })
    );

    const { container } = render(<DropZone onUploadComplete={onUploadComplete} />);
    const dropzone = container.firstChild as HTMLElement;
    const file = createPdfFile();

    await act(async () => {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          items: [
            {
              kind: "file",
              type: "application/pdf",
              getAsFile: () => file,
            },
          ],
          types: ["Files"],
        },
      });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/upload",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("calls onUploadComplete after successful upload", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ documentId: "doc-123", status: "processing" }), {
        status: 200,
      })
    );

    const { container } = render(<DropZone onUploadComplete={onUploadComplete} />);
    const dropzone = container.firstChild as HTMLElement;
    const file = createPdfFile();

    await act(async () => {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          items: [
            { kind: "file", type: "application/pdf", getAsFile: () => file },
          ],
          types: ["Files"],
        },
      });
    });

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalled();
    });
  });

  it("shows error toast when upload fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 })
    );

    const { container } = render(<DropZone onUploadComplete={onUploadComplete} />);
    const dropzone = container.firstChild as HTMLElement;
    const file = createPdfFile();

    await act(async () => {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          items: [
            { kind: "file", type: "application/pdf", getAsFile: () => file },
          ],
          types: ["Files"],
        },
      });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("shows error toast on network error", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    const { container } = render(<DropZone onUploadComplete={onUploadComplete} />);
    const dropzone = container.firstChild as HTMLElement;
    const file = createPdfFile();

    await act(async () => {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
          items: [
            { kind: "file", type: "application/pdf", getAsFile: () => file },
          ],
          types: ["Files"],
        },
      });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
  });
});
