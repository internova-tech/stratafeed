export type MarketQuote = {
  symbol: string;
  name?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;
  timestamp?: number | string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
  is_market_open?: boolean;
  is_simulated?: boolean;
};

export type MarketSearchResult = {
  symbol: string;
  instrument_name?: string;
  exchange?: string;
  country?: string;
  currency?: string;
  instrument_type?: string;
};

export class MarketDataError extends Error {
  constructor(message: string, public readonly status: number = 502) {
    super(message);
    this.name = "MarketDataError";
  }
}

const MOCK_INSTRUMENTS: Record<string, MarketQuote & { instrument_type: string; country: string }> = {
  "AAPL": { symbol: "AAPL", name: "SIMULATED Apple Inc.", exchange: "XNAS", currency: "USD", close: "190.00", previous_close: "189.50", change: "0.50", percent_change: "0.26", volume: "1000000", datetime: "SIMULATED", is_simulated: true, instrument_type: "Common Stock", country: "United States" },
  "MSFT": { symbol: "MSFT", name: "SIMULATED Microsoft Corporation", exchange: "XNAS", currency: "USD", close: "420.00", previous_close: "418.00", change: "2.00", percent_change: "0.48", volume: "800000", datetime: "SIMULATED", is_simulated: true, instrument_type: "Common Stock", country: "United States" },
  "NVDA": { symbol: "NVDA", name: "SIMULATED NVIDIA Corporation", exchange: "XNAS", currency: "USD", close: "120.00", previous_close: "121.00", change: "-1.00", percent_change: "-0.83", volume: "1200000", datetime: "SIMULATED", is_simulated: true, instrument_type: "Common Stock", country: "United States" },
  "RELIANCE": { symbol: "RELIANCE", name: "SIMULATED Reliance Industries", exchange: "XNSE", currency: "INR", close: "1400.00", previous_close: "1395.00", change: "5.00", percent_change: "0.36", volume: "500000", datetime: "SIMULATED", is_simulated: true, instrument_type: "Common Stock", country: "India" },
};

function providerName() {
  return (process.env.MARKET_DATA_PROVIDER ?? "mock").toLowerCase();
}

function getTwelveDataKey() {
  const key = process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY;
  if (!key) throw new MarketDataError("Twelve Data is not configured. Add TWELVE_DATA_API_KEY to the server environment.", 503);
  return key;
}

async function requestTwelveData<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://api.twelvedata.com/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("apikey", getTwelveDataKey());
  let response: Response;
  try { response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) }); }
  catch { throw new MarketDataError("Market data provider could not be reached. Try again shortly.", 502); }
  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new MarketDataError("Market data provider returned an unreadable response.", 502); }
  if (!response.ok) throw new MarketDataError("Market data provider request failed.", 502);
  if (typeof payload === "object" && payload !== null && "status" in payload && (payload as {status?: unknown}).status === "error") {
    const message = "message" in payload && typeof (payload as {message?: unknown}).message === "string" ? (payload as {message: string}).message : "The provider rejected the request.";
    throw new MarketDataError(message.slice(0, 240), 502);
  }
  return payload as T;
}

export async function getMarketQuote(symbol: string): Promise<MarketQuote> {
  const provider = providerName();
  if (provider === "mock") {
    const quote = MOCK_INSTRUMENTS[symbol.toUpperCase()];
    if (!quote) throw new MarketDataError("Symbol is not in the mock fixture set. Try AAPL, MSFT, NVDA, or RELIANCE.", 404);
    return { ...quote, datetime: new Date().toISOString(), is_simulated: true };
  }
  if (provider !== "twelvedata") throw new MarketDataError("Unsupported market data provider.", 503);
  const quote = await requestTwelveData<MarketQuote>("quote", { symbol });
  if (!quote || typeof quote !== "object" || typeof quote.symbol !== "string") throw new MarketDataError("No quote was returned for this symbol.", 404);
  return { ...quote, is_simulated: false };
}

export async function searchMarketSymbols(query: string): Promise<MarketSearchResult[]> {
  const provider = providerName();
  if (provider === "mock") {
    const term = query.toLowerCase();
    return Object.values(MOCK_INSTRUMENTS).filter((item) => item.symbol.toLowerCase().includes(term) || (item.name ?? "").toLowerCase().includes(term)).slice(0, 15).map(({ symbol, name, exchange, country, currency, instrument_type }) => ({ symbol, instrument_name: name, exchange, country, currency, instrument_type }));
  }
  if (provider !== "twelvedata") throw new MarketDataError("Unsupported market data provider.", 503);
  const result = await requestTwelveData<{ data?: MarketSearchResult[] }>("symbol_search", { symbol: query });
  return Array.isArray(result.data) ? result.data.slice(0, 15) : [];
}
