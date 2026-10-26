import { ChartFrame, EmptyState, Filter, StreamRow } from "@hybridappdev/primitives";
import { useMemo, useState } from "react";
import { PositionGrid } from "./grid";
import {
  filterPositions,
  isBookFilter,
  seedPositions,
  streamLines,
  unrealizedByBook,
  type BookFilter,
} from "./positions";

const bookOptions = [
  { value: "All", label: "All books" },
  { value: "Equities", label: "Equities" },
  { value: "Credit", label: "Credit" },
  { value: "Rates", label: "Rates" },
];

export function App() {
  const positions = useMemo(() => seedPositions(), []);
  const [book, setBook] = useState<BookFilter>("All");
  const rows = useMemo(() => filterPositions(positions, book), [positions, book]);
  const points = useMemo(() => unrealizedByBook(rows), [rows]);
  const lines = useMemo(() => streamLines(rows, book), [rows, book]);

  return (
    <main className="screen">
      <div className="filter">
        <Filter
          id="book"
          label="Book"
          options={bookOptions}
          value={book}
          onChange={(value) => {
            if (isBookFilter(value)) setBook(value);
          }}
        />
      </div>
      {rows.length === 0 ? (
        <div className="empty">
          <EmptyState title="No positions" reason="This book has nothing in the sample." />
        </div>
      ) : (
        <PositionGrid key={book} rows={rows} />
      )}
      <div className="chart">
        <ChartFrame title="Unrealized by book" tone="neutral" points={points} />
      </div>
      <section className="stream" aria-label="Model stream">
        {lines.map((line) => (
          <StreamRow key={line.key} source="model" state={line.state} text={line.text} />
        ))}
      </section>
    </main>
  );
}
