const fallbackWindow = 16;

export function visibleRange(input: {
  scrollTop: number;
  viewport: number;
  rowHeight: number;
  count: number;
  overscan: number;
}): { start: number; end: number } {
  const { scrollTop, viewport, rowHeight, count, overscan } = input;
  if (count <= 0) return { start: 0, end: 0 };
  if (rowHeight <= 0) return { start: 0, end: Math.min(count, fallbackWindow) };

  const view = viewport > 0 ? viewport : rowHeight * fallbackWindow;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(count, Math.ceil((scrollTop + view) / rowHeight) + overscan);
  return { start, end };
}
