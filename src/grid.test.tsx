import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PositionGrid } from "./grid";
import { seedPositions } from "./positions";

describe("grid", () => {
  it("pins symbol and recycles rows", () => {
    const html = renderToStaticMarkup(createElement(PositionGrid, { rows: seedPositions() }));
    expect(html).toContain('aria-rowcount="5000"');
    expect(html).toContain('data-density="compact"');
    expect(html).toMatch(/data-pinned="true"[^>]*>Symbol/);
    expect(html).toContain('data-tone="negative"');
    const mounted = html.match(/data-row-index="/g) ?? [];
    expect(mounted.length).toBeGreaterThan(0);
    expect(mounted.length).toBeLessThan(80);
  });
});
