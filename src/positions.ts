export const books = ["Equities", "Credit", "Rates"] as const;

export type Book = (typeof books)[number];

export const bookFilters = ["All", ...books] as const;

export type BookFilter = (typeof bookFilters)[number];

export type ValueTone = "positive" | "negative" | "neutral";

export type Position = {
  symbol: string;
  book: Book;
  qty: number;
  price: number;
  unrealized: number;
  day: number;
};

export type ColumnKey = keyof Position;

export type Column = {
  key: ColumnKey;
  header: string;
  align: "start" | "end";
  pinned: boolean;
  signed: boolean;
};

export const columns: Column[] = [
  { key: "symbol", header: "Symbol", align: "start", pinned: true, signed: false },
  { key: "book", header: "Book", align: "start", pinned: false, signed: false },
  { key: "qty", header: "Qty", align: "end", pinned: false, signed: false },
  { key: "price", header: "Price", align: "end", pinned: false, signed: false },
  { key: "unrealized", header: "Unrealized", align: "end", pinned: false, signed: true },
  { key: "day", header: "Day", align: "end", pinned: false, signed: true },
];

const symbols = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "JPM",
  "XOM",
  "BAC",
  "WFC",
  "GS",
  "C",
  "T",
  "VZ",
  "IBM",
  "ORCL",
  "CSCO",
  "INTC",
  "AMD",
  "QCOM",
  "HYG",
  "LQD",
  "TLT",
  "IEF",
  "US10Y",
  "US30Y",
  "EUR",
  "GBP",
] as const;

const positionCount = 5000;
const seed = 0xb1077e;

export function isBookFilter(value: string): value is BookFilter {
  return (bookFilters as readonly string[]).includes(value);
}

export function toneForValue(value: number): ValueTone {
  if (value < 0) return "negative";
  if (value > 0) return "positive";
  return "neutral";
}

export function seedPositions(count = positionCount): Position[] {
  const random = mulberry32(seed);
  const rows: Position[] = [];

  for (let index = 0; index < count; index += 1) {
    const book = books[index % books.length] ?? "Equities";
    const root = symbols[index % symbols.length] ?? "AAPL";
    const series = Math.floor(index / symbols.length);
    const symbol = series === 0 ? root : `${root}-${series}`;
    const qtyMagnitude = 10 + Math.floor(random() * 1900);
    const qty = random() > 0.42 ? qtyMagnitude : -qtyMagnitude;
    const price = round2(6 + random() * 480);
    const noise = 0.25 + random() * 8;
    let unrealized = round2(noise);
    if (book === "Equities") unrealized = round2(noise + 3);
    if (book === "Credit") unrealized = round2(-(noise + 1.5));
    if (book === "Rates") unrealized = round2((random() > 0.45 ? 1 : -1) * noise * 0.7);
    if (index === 0) unrealized = 4200;
    if (index === 1) unrealized = -2600;
    if (index === 2) unrealized = 1500;
    const day = round2((random() - 0.48) * 18);
    rows.push({ symbol, book, qty, price, unrealized, day });
  }

  return rows;
}

export function filterPositions(rows: readonly Position[], book: BookFilter): Position[] {
  if (book === "All") return [...rows];
  return rows.filter((row) => row.book === book);
}

export function unrealizedByBook(rows: readonly Position[]): number[] {
  const totals = books.map(() => 0);
  for (const row of rows) {
    const index = books.indexOf(row.book);
    const current = totals[index];
    if (current === undefined) continue;
    totals[index] = current + row.unrealized;
  }
  return totals.map((total) => round2(total));
}

export type StreamLine = {
  key: "concentration" | "credit" | "largest" | "reading";
  state: "settled" | "streaming";
  text: string;
};

export function streamLines(rows: readonly Position[], book: BookFilter): StreamLine[] {
  const scope = book === "All" ? "all books" : book;
  return [
    { key: "concentration", state: "settled", text: concentrationText(rows, scope) },
    { key: "credit", state: "settled", text: creditText(rows, scope) },
    { key: "largest", state: "settled", text: largestText(rows, scope) },
    {
      key: "reading",
      state: "streaming",
      text: `Reading ${scope} for concentration, the credit drag, and the largest line.`,
    },
  ];
}

export function formatCell(row: Position, column: Column): string {
  const value = row[column.key];
  if (typeof value === "string") return value;
  if (column.key === "qty") return formatFigure(value, 0);
  if (column.signed) return formatSigned(value);
  return formatFigure(value, 2);
}

function concentrationText(rows: readonly Position[], scope: string): string {
  const gross = grossUnrealized(rows);
  if (gross === 0 || rows.length === 0) return `Nothing is concentrated in ${scope}.`;

  const present = new Set(rows.map((row) => row.book));
  if (present.size > 1) {
    const top = books
      .map((book) => ({
        book,
        gross: grossUnrealized(rows.filter((row) => row.book === book)),
      }))
      .sort((left, right) => right.gross - left.gross)[0];
    if (!top) return `Nothing is concentrated in ${scope}.`;
    return `${top.book} is ${percent(top.gross, gross)}% of gross unrealized in ${scope}.`;
  }

  const top = largestByAbsolute(rows);
  if (!top) return `Nothing is concentrated in ${scope}.`;
  return `${top.symbol} is ${percent(Math.abs(top.unrealized), gross)}% of gross unrealized in ${scope}.`;
}

function creditText(rows: readonly Position[], scope: string): string {
  const credit = rows.filter((row) => row.book === "Credit");
  if (credit.length === 0) return `Credit drag is outside ${scope}.`;
  const drag = round2(credit.reduce((sum, row) => sum + row.unrealized, 0));
  return `Credit drag is ${formatSigned(drag)} in ${scope}.`;
}

function largestText(rows: readonly Position[], scope: string): string {
  const top = largestByAbsolute(rows);
  if (!top) return `There is no largest line in ${scope}.`;
  return `Largest line in ${scope} is ${top.symbol} at ${formatSigned(top.unrealized)}.`;
}

function largestByAbsolute(rows: readonly Position[]): Position | undefined {
  return rows.reduce<Position | undefined>((best, row) => {
    if (!best || Math.abs(row.unrealized) > Math.abs(best.unrealized)) return row;
    return best;
  }, undefined);
}

function grossUnrealized(rows: readonly Position[]): number {
  return rows.reduce((sum, row) => sum + Math.abs(row.unrealized), 0);
}

function percent(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

function formatSigned(value: number, digits = 2): string {
  if (value > 0) return `+${formatFigure(value, digits)}`;
  return formatFigure(value, digits);
}

function formatFigure(value: number, digits: number): string {
  const negative = value < 0;
  const [whole, fraction] = Math.abs(value).toFixed(digits).split(".");
  const grouped = (whole ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = fraction === undefined ? grouped : `${grouped}.${fraction}`;
  return negative ? `−${body}` : body;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function mulberry32(initial: number): () => number {
  let state = initial >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
