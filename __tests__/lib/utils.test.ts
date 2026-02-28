import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("merges simple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    // tailwind-merge keeps the last of conflicting utilities
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
  });

  it("handles conditional classes via clsx", () => {
    const active = true;
    const disabled = false;
    const result = cn("base", active && "active", disabled && "disabled");
    expect(result).toBe("base active");
  });

  it("filters out falsy values", () => {
    const result = cn("a", false, null, undefined, "b");
    expect(result).toBe("a b");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles single class", () => {
    expect(cn("text-sm")).toBe("text-sm");
  });

  it("merges array-style inputs", () => {
    const result = cn(["flex", "items-center"], "gap-2");
    expect(result).toBe("flex items-center gap-2");
  });

  it("resolves bg color conflicts", () => {
    const result = cn("bg-red-500", "bg-blue-500");
    expect(result).toBe("bg-blue-500");
  });

  it("handles object syntax from clsx", () => {
    const result = cn({ "font-bold": true, "font-normal": false });
    expect(result).toBe("font-bold");
  });
});
