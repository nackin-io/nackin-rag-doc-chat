import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentList } from "@/components/documents/DocumentList";
import type { Document } from "@/types";

const mockDocs: Document[] = [
  {
    id: "1",
    name: "report.pdf",
    size: 204800,
    status: "ready",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "manual.pdf",
    size: 512000,
    status: "processing",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "notes.pdf",
    size: null,
    status: "error",
    created_at: new Date().toISOString(),
  },
];

describe("DocumentList", () => {
  const onSelect = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    onSelect.mockClear();
    onDelete.mockClear();
  });

  it("shows empty state when no documents", () => {
    render(
      <DocumentList documents={[]} selectedId={null} onSelect={onSelect} onDelete={onDelete} />
    );
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading=true", () => {
    const { container } = render(
      <DocumentList
        documents={[]}
        selectedId={null}
        onSelect={onSelect}
        onDelete={onDelete}
        isLoading={true}
      />
    );
    // Skeleton has animate-pulse class
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("renders document names", () => {
    render(
      <DocumentList documents={mockDocs} selectedId={null} onSelect={onSelect} onDelete={onDelete} />
    );
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("manual.pdf")).toBeInTheDocument();
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(
      <DocumentList documents={mockDocs} selectedId={null} onSelect={onSelect} onDelete={onDelete} />
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Processing…")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("calls onSelect with document id when clicking a document", () => {
    render(
      <DocumentList documents={mockDocs} selectedId={null} onSelect={onSelect} onDelete={onDelete} />
    );
    const button = screen.getByLabelText("Select document: report.pdf");
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("calls onSelect with null when clicking All Documents", () => {
    render(
      <DocumentList documents={mockDocs} selectedId="1" onSelect={onSelect} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByLabelText("Chat with all documents"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("calls onDelete when delete button is clicked", () => {
    render(
      <DocumentList documents={mockDocs} selectedId={null} onSelect={onSelect} onDelete={onDelete} />
    );
    const deleteBtn = screen.getByLabelText("Delete report.pdf");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("delete button does not trigger onSelect", () => {
    render(
      <DocumentList documents={mockDocs} selectedId={null} onSelect={onSelect} onDelete={onDelete} />
    );
    const deleteBtn = screen.getByLabelText("Delete report.pdf");
    fireEvent.click(deleteBtn);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("highlights the selected document", () => {
    render(
      <DocumentList documents={mockDocs} selectedId="1" onSelect={onSelect} onDelete={onDelete} />
    );
    const button = screen.getByLabelText("Select document: report.pdf");
    // The parent container has bg-accent class
    const container = button.closest('[class*="bg-accent"]');
    expect(container).toBeTruthy();
  });

  it("disables delete for processing documents", () => {
    render(
      <DocumentList documents={mockDocs} selectedId={null} onSelect={onSelect} onDelete={onDelete} />
    );
    const deleteBtn = screen.getByLabelText("Delete manual.pdf");
    expect(deleteBtn).toBeDisabled();
  });

  it("shows formatted file sizes", () => {
    render(
      <DocumentList documents={mockDocs} selectedId={null} onSelect={onSelect} onDelete={onDelete} />
    );
    // 204800 bytes = 200 KB
    expect(screen.getByText("200 KB")).toBeInTheDocument();
    // 512000 bytes = 500 KB
    expect(screen.getByText("500 KB")).toBeInTheDocument();
  });
});
