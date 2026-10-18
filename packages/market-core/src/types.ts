export type MarketDataMode = "mock" | "delayed" | "realtime";

export type MarketQuote = {
  type: "quote";
  symbol: string;
  exchange: string;
  currency: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  lastSize: number | null;
  volume: number | null;
  source: string;
  mode: MarketDataMode;
  eventTime: string;
  receivedAt: string;
  sequence: number;
  isSimulated: boolean;
};

export type MarketTrade = {
  type: "trade";
  symbol: string;
  exchange: string;
  price: number;
  size: number;
  source: string;
  mode: MarketDataMode;
  eventTime: string;
  receivedAt: string;
  sequence: number;
  isSimulated: boolean;
};

export type NormalizedMarketEvent = MarketQuote | MarketTrade;

export type ProviderHealth = {
  provider: string;
  connected: boolean;
  lastMessageAt: string | null;
  reconnectAttempts: number;
  error: string | null;
};

export type ProviderAdapter = {
  readonly name: string;
  connect(signal?: AbortSignal): Promise<void>;
  subscribe(symbols: string[]): Promise<void>;
  unsubscribe(symbols: string[]): Promise<void>;
  close(): Promise<void>;
  health(): ProviderHealth;
  onEvent(listener: (event: NormalizedMarketEvent) => void): () => void;
};
