import { useLayoutEffect, useRef, useState, type CSSProperties, type UIEvent } from "react";
import { columns, formatCell, toneForValue, type Position } from "./positions";
import { visibleRange } from "./window";

const overscan = 6;

type Range = { start: number; end: number };

export function PositionGrid({ rows }: { rows: readonly Position[] }) {
  const viewRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const metrics = useRef({ scrollTop: 0, viewport: 0, rowHeight: 0 });
  const [range, setRange] = useState<Range>({ start: 0, end: Math.min(rows.length, 16) });

  const publish = () => {
    const next = visibleRange({ ...metrics.current, count: rows.length, overscan });
    setRange((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    );
  };

  useLayoutEffect(() => {
    const view = viewRef.current;
    const head = headRef.current;
    if (!view || !head) return;

    const measure = () => {
      metrics.current.viewport = view.clientHeight;
      metrics.current.rowHeight = head.getBoundingClientRect().height;
      const gutter = view.offsetWidth - view.clientWidth;
      view.parentElement?.style.setProperty("--scrollbar", `${gutter}px`);
      publish();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    observer.observe(head);
    return () => observer.disconnect();
  }, [rows.length]);

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollLeft } = event.currentTarget;
    metrics.current.scrollTop = scrollTop;
    if (clipRef.current) clipRef.current.scrollLeft = scrollLeft;
    publish();
  };

  const slice = rows.slice(range.start, range.end);
  const spacerStyle = { "--row-count": String(rows.length) } as CSSProperties;

  return (
    <div
      className="positions"
      role="grid"
      aria-label="Positions"
      aria-rowcount={rows.length}
      aria-colcount={columns.length}
      data-density="compact"
    >
      <div className="head-clip" ref={clipRef}>
        <div className="track header" role="row" ref={headRef}>
          {columns.map((column) => (
            <div
              key={column.key}
              role="columnheader"
              className="cell"
              data-align={column.align}
              {...(column.pinned ? { "data-pinned": "true" } : {})}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>
      <div className="viewport" ref={viewRef} role="rowgroup" onScroll={onScroll}>
        <div className="spacer" style={spacerStyle}>
          {slice.map((row, offset) => {
            const index = range.start + offset;
            const rowStyle = { "--row-index": String(index) } as CSSProperties;
            return (
              <div
                key={index}
                className="track row"
                role="row"
                data-row-index={index}
                style={rowStyle}
              >
                {columns.map((column) => {
                  const raw = row[column.key];
                  const tone = column.signed && typeof raw === "number" ? toneForValue(raw) : undefined;
                  return (
                    <div
                      key={column.key}
                      role="gridcell"
                      className="cell"
                      data-align={column.align}
                      {...(column.pinned ? { "data-pinned": "true" } : {})}
                      {...(tone ? { "data-tone": tone } : {})}
                    >
                      {formatCell(row, column)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
