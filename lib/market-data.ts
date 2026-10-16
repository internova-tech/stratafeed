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
  constructor(
    message: string,
    public readonly status: number = 502,
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}

function getTwelveDataKey() {
  const provider = (process.env.MARKET_DATA_PROVIDER ?? "twelvedata").toLowerCase();
  const key = process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY;
  if (provider !== "twelvedata") {
    throw new MarketDataError("Unsupported market data provider. Set MARKET_DATA_PROVIDER=twelvedata.", 503);
  }
  if (!key) {
    throw new MarketDataError("Live market data is not configured. Add TWELVE_DATA_API_KEY to the server environment.", 503);
  }
  return key;
}

async function requestTwelveData<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = getTwelveDataKey();
  const url = new URL(`https://api.twelvedata.com/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("apikey", key);

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new MarketDataError("Market data provider could not be reached. Try again shortly.", 502);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MarketDataError("Market data provider returned an unreadable response.", 502);
  }

  if (!response.ok) throw new MarketDataError("Market data provider request failed.", 502);
  if (typeof payload === "object" && payload !== null && "status" in payload && (payload as {status?: unknown}).status === "error") {
    const providerMessage = "message" in payload && typeof (payload as {message?: unknown}).message === "string"
      ? (payload as {message: string}).message
      : "The provider rejected the request.";
    throw new MarketDataError(providerMessage.slice(0, 240), 502);
  }
  return payload as T;
}

export async function getMarketQuote(symbol: string): Promise<MarketQuote> {
  const quote = await requestTwelveData<MarketQuote>("quote", { symbol });
  if (!quote || typeof quote !== "object" || typeof quote.symbol !== "string") {
    throw new MarketDataError("No quote was returned for this symbol.", 404);
  }
  return quote;
}

export async function searchMarketSymbols(query: string): Promise<MarketSearchResult[]> {
  const result = await requestTwelveData<{ data?: MarketSearchResult[] }>("symbol_search", { symbol: query });
  return Array.isArray(result.data) ? result.data.slice(0, 15) : [];
}
