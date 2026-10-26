import { describe, expect, it } from "vitest";
import {
  columns,
  filterPositions,
  seedPositions,
  streamLines,
  toneForValue,
  unrealizedByBook,
} from "./positions";
import { visibleRange } from "./window";

describe("positions", () => {
  it("keeps the seed stable", () => {
    const first = seedPositions();
    const second = seedPositions();
    expect(first).toEqual(second);
    expect(first).toHaveLength(5000);
    expect(first[0]).toMatchObject({ symbol: "AAPL", book: "Equities" });
  });

  it("subsets rows by book", () => {
    const rows = seedPositions();
    const credit = filterPositions(rows, "Credit");
    expect(credit.length).toBeGreaterThan(0);
    expect(credit.length).toBeLessThan(rows.length);
    expect(credit.every((row) => row.book === "Credit")).toBe(true);
    expect(filterPositions(rows, "All")).toHaveLength(5000);

    const points = unrealizedByBook(credit);
    expect(points).toHaveLength(3);
    expect(points[0]).toBe(0);
    expect(points[2]).toBe(0);
    expect(points[1]).toBeLessThan(0);
  });

  it("resolves a negative unrealized to the negative tone", () => {
    expect(toneForValue(-1)).toBe("negative");
    expect(toneForValue(1)).toBe("positive");
    expect(toneForValue(0)).toBe("neutral");
    const negative = seedPositions().find((row) => row.unrealized < 0);
    expect(negative).toBeDefined();
    expect(toneForValue(negative?.unrealized ?? 0)).toBe("negative");
  });

  it("marks the symbol column pinned", () => {
    expect(columns.find((column) => column.key === "symbol")?.pinned).toBe(true);
    expect(columns.filter((column) => column.pinned).map((column) => column.key)).toEqual([
      "symbol",
    ]);
  });

  it("describes the current filter in the stream", () => {
    const lines = streamLines(filterPositions(seedPositions(), "Credit"), "Credit");
    expect(lines.map((line) => line.state)).toEqual(["settled", "settled", "settled", "streaming"]);
    expect(lines.every((line) => line.text.includes("Credit"))).toBe(true);
  });
});

describe("window", () => {
  it("mounts a slice when the last row is in view", () => {
    const rowHeight = 32;
    const count = 5000;
    const viewport = 320;
    const range = visibleRange({
      scrollTop: (count - 1) * rowHeight,
      viewport,
      rowHeight,
      count,
      overscan: 4,
    });
    expect(range.end).toBe(count);
    expect(range.start).toBeGreaterThan(4900);
    expect(range.end - range.start).toBeLessThan(40);
  });
});
