import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SourceCitations } from "@/components/chat/SourceCitations";
import type { ChunkMatch } from "@/types";

const mockSources: ChunkMatch[] = [
  {
    id: "chunk-1",
    document_id: "doc-1",
    content: "The quarterly revenue exceeded expectations with 15% growth.",
    similarity: 0.87,
  },
  {
    id: "chunk-2",
    document_id: "doc-1",
    content: "Operating expenses were reduced by optimizing supply chain logistics.",
    similarity: 0.72,
  },
];

describe("SourceCitations", () => {
  it("renders nothing when sources array is empty", () => {
    const { container } = render(<SourceCitations sources={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders source badges", () => {
    render(<SourceCitations sources={mockSources} />);
    expect(screen.getByText(/87%/)).toBeInTheDocument();
    expect(screen.getByText(/72%/)).toBeInTheDocument();
  });

  it("displays source content in popover when badge is clicked", () => {
    render(<SourceCitations sources={mockSources} />);
    const badge = screen.getByLabelText(/Source 1/i);
    fireEvent.click(badge);
    expect(screen.getByText(/quarterly revenue exceeded expectations/i)).toBeInTheDocument();
  });

  it("closes popover when same badge is clicked again", () => {
    render(<SourceCitations sources={mockSources} />);
    const badge = screen.getByLabelText(/Source 1/i);
    fireEvent.click(badge);
    expect(screen.queryByText(/quarterly revenue/i)).toBeInTheDocument();
    fireEvent.click(badge);
    expect(screen.queryByText(/quarterly revenue/i)).not.toBeInTheDocument();
  });

  it("shows only one popover at a time when clicking different badges", () => {
    render(<SourceCitations sources={mockSources} />);
    const badge1 = screen.getByLabelText(/Source 1/i);
    const badge2 = screen.getByLabelText(/Source 2/i);

    fireEvent.click(badge1);
    expect(screen.queryByText(/quarterly revenue/i)).toBeInTheDocument();

    fireEvent.click(badge2);
    expect(screen.queryByText(/quarterly revenue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supply chain/i)).toBeInTheDocument();
  });

  it("closes popover when close button is clicked", () => {
    render(<SourceCitations sources={mockSources} />);
    const badge = screen.getByLabelText(/Source 1/i);
    fireEvent.click(badge);
    expect(screen.queryByText(/quarterly revenue/i)).toBeInTheDocument();
    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/quarterly revenue/i)).not.toBeInTheDocument();
  });

  it("shows aria-expanded=true on open badge", () => {
    render(<SourceCitations sources={mockSources} />);
    const badge = screen.getByLabelText(/Source 1/i);
    expect(badge).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(badge);
    expect(badge).toHaveAttribute("aria-expanded", "true");
  });

  it("shows 'Sources:' label", () => {
    render(<SourceCitations sources={mockSources} />);
    expect(screen.getByText("Sources:")).toBeInTheDocument();
  });
});
