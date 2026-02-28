import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { ChatMessage } from "@/types";

const baseTimestamp = new Date("2024-01-15T14:30:00");

const userMessage: ChatMessage = {
  id: "msg-1",
  role: "user",
  content: "What is this document about?",
  timestamp: baseTimestamp,
};

const assistantMessage: ChatMessage = {
  id: "msg-2",
  role: "assistant",
  content: "This document covers **financial reporting** for Q3.",
  sources: [
    {
      id: "chunk-1",
      document_id: "doc-1",
      content: "Financial report for Q3 2024",
      similarity: 0.91,
    },
  ],
  timestamp: baseTimestamp,
};

const assistantNoSources: ChatMessage = {
  id: "msg-3",
  role: "assistant",
  content: "I don't have enough context.",
  sources: [],
  timestamp: baseTimestamp,
};

describe("MessageBubble", () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders user message content", () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.getByText("What is this document about?")).toBeInTheDocument();
  });

  it("renders assistant message content (markdown)", () => {
    render(<MessageBubble message={assistantMessage} />);
    // ReactMarkdown renders **financial reporting** as <strong>
    expect(screen.getByText("financial reporting")).toBeInTheDocument();
  });

  it("aligns user messages to the right", () => {
    const { container } = render(<MessageBubble message={userMessage} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-end");
  });

  it("aligns assistant messages to the left", () => {
    const { container } = render(<MessageBubble message={assistantMessage} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-start");
  });

  it("shows AI avatar for assistant messages", () => {
    render(<MessageBubble message={assistantMessage} />);
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("shows You avatar for user messages", () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("renders source citations for assistant with sources", () => {
    render(<MessageBubble message={assistantMessage} />);
    // 91% similarity source should appear
    expect(screen.getByText(/91%/)).toBeInTheDocument();
  });

  it("does not render source citations when empty", () => {
    render(<MessageBubble message={assistantNoSources} />);
    expect(screen.queryByText("Sources:")).not.toBeInTheDocument();
  });

  it("does not render source citations for user messages", () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.queryByText("Sources:")).not.toBeInTheDocument();
  });

  it("shows copy button for assistant messages", () => {
    render(<MessageBubble message={assistantMessage} />);
    expect(screen.getByLabelText("Copy message")).toBeInTheDocument();
  });

  it("does not show copy button for user messages", () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.queryByLabelText("Copy message")).not.toBeInTheDocument();
  });

  it("copies text when copy button is clicked", async () => {
    render(<MessageBubble message={assistantMessage} />);
    const copyBtn = screen.getByLabelText("Copy message");
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "This document covers **financial reporting** for Q3."
    );
  });

  it("shows 'Copied!' label after clicking copy", async () => {
    render(<MessageBubble message={assistantMessage} />);
    const copyBtn = screen.getByLabelText("Copy message");
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(screen.getByLabelText("Copied!")).toBeInTheDocument();
  });

  it("renders timestamp", () => {
    render(<MessageBubble message={userMessage} />);
    // Should show a time string like "2:30 PM"
    const timeEl = screen.getByText(/\d+:\d+/);
    expect(timeEl).toBeInTheDocument();
  });

  it("handles string timestamp gracefully", () => {
    const msgWithStringTs = {
      ...userMessage,
      timestamp: "2024-01-15T14:30:00" as unknown as Date,
    };
    expect(() => render(<MessageBubble message={msgWithStringTs} />)).not.toThrow();
  });
});
