import type { MarketQuote, MarketTrade } from "./types";

const SYMBOL = /^[A-Z0-9][A-Z0-9._:/-]{0,39}$/;
const EXCHANGE = /^[A-Z0-9_-]{1,20}$/;

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeQuote(input: unknown): MarketQuote {
  if (!input || typeof input !== "object") throw new Error("Quote event must be an object");
  const value = input as Record<string, unknown>;
  if (typeof value.symbol !== "string" || !SYMBOL.test(value.symbol.toUpperCase())) throw new Error("Invalid quote symbol");
  if (typeof value.exchange !== "string" || !EXCHANGE.test(value.exchange.toUpperCase())) throw new Error("Invalid exchange code");
  if (typeof value.source !== "string" || value.source.length < 1 || value.source.length > 80) throw new Error("Invalid quote source");
  if (value.mode !== "mock" && value.mode !== "delayed" && value.mode !== "realtime") throw new Error("Invalid market data mode");
  if (typeof value.sequence !== "number" || !Number.isSafeInteger(value.sequence) || value.sequence < 0) throw new Error("Invalid sequence");
  if (typeof value.eventTime !== "string" || Number.isNaN(Date.parse(value.eventTime))) throw new Error("Invalid event timestamp");
  if (typeof value.receivedAt !== "string" || Number.isNaN(Date.parse(value.receivedAt))) throw new Error("Invalid received timestamp");
  if (typeof value.isSimulated !== "boolean") throw new Error("Simulation flag is required");
  const bid = finiteOrNull(value.bid);
  const ask = finiteOrNull(value.ask);
  const last = finiteOrNull(value.last);
  if (bid !== null && bid < 0 || ask !== null && ask < 0 || last !== null && last < 0) throw new Error("Prices cannot be negative");
  if (bid !== null && ask !== null && bid > ask) throw new Error("Bid cannot exceed ask");
  return {
    type: "quote",
    symbol: value.symbol.toUpperCase(),
    exchange: value.exchange.toUpperCase(),
    currency: typeof value.currency === "string" ? value.currency.toUpperCase().slice(0, 8) : "USD",
    bid, ask, last,
    lastSize: finiteOrNull(value.lastSize),
    volume: finiteOrNull(value.volume),
    source: value.source,
    mode: value.mode,
    eventTime: value.eventTime,
    receivedAt: value.receivedAt,
    sequence: value.sequence,
    isSimulated: value.isSimulated,
  };
}

export function normalizeTrade(input: unknown): MarketTrade {
  if (!input || typeof input !== "object") throw new Error("Trade event must be an object");
  const value = input as Record<string, unknown>;
  if (typeof value.symbol !== "string" || !SYMBOL.test(value.symbol.toUpperCase())) throw new Error("Invalid trade symbol");
  if (typeof value.exchange !== "string" || !EXCHANGE.test(value.exchange.toUpperCase())) throw new Error("Invalid exchange code");
  if (typeof value.source !== "string" || value.source.length < 1 || value.source.length > 80) throw new Error("Invalid trade source");
  if (value.mode !== "mock" && value.mode !== "delayed" && value.mode !== "realtime") throw new Error("Invalid market data mode");
  if (typeof value.sequence !== "number" || !Number.isSafeInteger(value.sequence) || value.sequence < 0) throw new Error("Invalid sequence");
  if (typeof value.eventTime !== "string" || Number.isNaN(Date.parse(value.eventTime))) throw new Error("Invalid event timestamp");
  if (typeof value.receivedAt !== "string" || Number.isNaN(Date.parse(value.receivedAt))) throw new Error("Invalid received timestamp");
  if (typeof value.isSimulated !== "boolean") throw new Error("Simulation flag is required");
  if (typeof value.price !== "number" || !Number.isFinite(value.price) || value.price < 0) throw new Error("Invalid trade price");
  if (typeof value.size !== "number" || !Number.isFinite(value.size) || value.size < 0) throw new Error("Invalid trade size");
  return { type: "trade", symbol: value.symbol.toUpperCase(), exchange: value.exchange.toUpperCase(), price: value.price, size: value.size, source: value.source, mode: value.mode, eventTime: value.eventTime, receivedAt: value.receivedAt, sequence: value.sequence, isSimulated: value.isSimulated };
}
