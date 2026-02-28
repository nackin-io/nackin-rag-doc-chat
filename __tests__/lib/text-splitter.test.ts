import { describe, it, expect } from "vitest";
import { recursiveCharacterSplit } from "@/lib/text-splitter";

describe("recursiveCharacterSplit", () => {
  it("returns the original text as a single chunk when it fits within chunkSize", () => {
    const text = "Short text";
    const result = recursiveCharacterSplit(text, { chunkSize: 100 });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Short text");
  });

  it("splits text that exceeds chunkSize", () => {
    const text = "A".repeat(2500);
    const result = recursiveCharacterSplit(text, { chunkSize: 1000, chunkOverlap: 0 });
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(1000);
    }
  });

  it("prefers paragraph breaks over arbitrary character splits", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const result = recursiveCharacterSplit(text, { chunkSize: 30, chunkOverlap: 0 });
    expect(result.some((c) => c.includes("First paragraph"))).toBe(true);
    expect(result.some((c) => c.includes("Second paragraph"))).toBe(true);
    expect(result.some((c) => c.includes("Third paragraph"))).toBe(true);
  });

  it("filters out empty chunks", () => {
    const text = "  \n\n  \nActual content here\n\n  ";
    const result = recursiveCharacterSplit(text, { chunkSize: 1000 });
    for (const chunk of result) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  it("returns empty array for empty string", () => {
    const result = recursiveCharacterSplit("", { chunkSize: 1000 });
    expect(result).toHaveLength(0);
  });

  it("returns empty array for whitespace-only string", () => {
    const result = recursiveCharacterSplit("   \n\n   ", { chunkSize: 1000 });
    expect(result).toHaveLength(0);
  });

  it("uses default options when none provided", () => {
    const text = "Hello world.";
    const result = recursiveCharacterSplit(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Hello world.");
  });

  it("handles chunkOverlap = 0 without adding overlap", () => {
    const text = "Word1 Word2 Word3 Word4 Word5";
    const result = recursiveCharacterSplit(text, { chunkSize: 12, chunkOverlap: 0 });
    // With overlap=0 the total character count should not exceed text length significantly
    const totalChars = result.join("").length;
    expect(totalChars).toBeLessThanOrEqual(text.length + 10);
  });

  it("creates overlap chunks when chunkOverlap > 0", () => {
    const sentences = Array.from({ length: 20 }, (_, i) => `Sentence ${i + 1} here.`).join(" ");
    const without = recursiveCharacterSplit(sentences, { chunkSize: 200, chunkOverlap: 0 });
    const with_ = recursiveCharacterSplit(sentences, { chunkSize: 200, chunkOverlap: 50 });
    // Overlap makes later chunks longer (they include a tail from the previous chunk)
    expect(with_.length).toBeGreaterThanOrEqual(without.length);
  });

  it("handles single very long word without separator", () => {
    const word = "A".repeat(3000);
    const result = recursiveCharacterSplit(word, { chunkSize: 1000, chunkOverlap: 0 });
    expect(result.length).toBeGreaterThan(1);
  });

  it("preserves custom separators option", () => {
    const text = "Section1|Section2|Section3";
    // With default separators (no "|"), whole text is one chunk if short enough
    const default_ = recursiveCharacterSplit(text, { chunkSize: 100 });
    expect(default_).toHaveLength(1);

    // With "|" as separator and small chunk size, it should split
    const custom = recursiveCharacterSplit(text, {
      chunkSize: 15,
      chunkOverlap: 0,
      separators: ["|", ""],
    });
    expect(custom.length).toBeGreaterThan(1);
  });
});
