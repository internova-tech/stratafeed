import { EventEmitter } from "node:events";
import { normalizeQuote, normalizeTrade } from "../../../../packages/market-core/src/normalize";
import type { MarketQuote, MarketTrade, NormalizedMarketEvent, ProviderAdapter, ProviderHealth } from "../../../../packages/market-core/src/types";

const DEFAULTS: Record<string, { price: number; exchange: string; currency: string }> = {
  "DEMO.AAPL": { price: 190, exchange: "XNAS", currency: "USD" },
  "DEMO.MSFT": { price: 420, exchange: "XNAS", currency: "USD" },
  "DEMO.NVDA": { price: 120, exchange: "XNAS", currency: "USD" },
  "DEMO.RELIANCE": { price: 1400, exchange: "XNSE", currency: "INR" },
};

export class MockMarketDataAdapter implements ProviderAdapter {
  readonly name = "mock-simulator";
  private readonly emitter = new EventEmitter();
  private timer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  private symbols = new Set<string>();
  private seq = 0;
  private lastMessageAt: string | null = null;
  private reconnectAttempts = 0;

  constructor(private readonly intervalMs = 1000, private readonly random: () => number = Math.random) {
    if (!Number.isInteger(intervalMs) || intervalMs < 100 || intervalMs > 60_000) throw new Error("Mock interval must be 100-60000ms");
  }

  async connect(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) throw new Error("Connection aborted");
    if (this.connected) return;
    this.connected = true;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
    signal?.addEventListener("abort", () => { void this.close(); }, { once: true });
  }

  async subscribe(symbols: string[]): Promise<void> {
    if (!this.connected) throw new Error("Provider is not connected");
    if (symbols.length > 1000) throw new Error("Subscription batch too large");
    for (const symbol of symbols) {
      const normalized = symbol.toUpperCase();
      if (!/^[A-Z0-9][A-Z0-9._:/-]{0,39}$/.test(normalized)) throw new Error("Invalid symbol");
      this.symbols.add(normalized);
    }
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    for (const symbol of symbols) this.symbols.delete(symbol.toUpperCase());
  }

  async close(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.connected = false;
  }

  health(): ProviderHealth {
    return { provider: this.name, connected: this.connected, lastMessageAt: this.lastMessageAt, reconnectAttempts: this.reconnectAttempts, error: null };
  }

  onEvent(listener: (event: NormalizedMarketEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }

  private tick(): void {
    if (!this.connected) return;
    const now = new Date().toISOString();
    for (const symbol of this.symbols) {
      const key = symbol.startsWith("DEMO.") ? symbol : `DEMO.${symbol}`;
      const base = DEFAULTS[key] ?? { price: 50 + this.random() * 150, exchange: "XMOCK", currency: "USD" };
      const mid = Math.max(0.01, base.price * (1 + (this.random() - 0.5) * 0.002));
      const sequence = ++this.seq;
      const quote: MarketQuote = normalizeQuote({
        symbol: symbol.replace(/^DEMO\./, ""), exchange: base.exchange, currency: base.currency,
        bid: Number((mid - 0.01).toFixed(4)), ask: Number((mid + 0.01).toFixed(4)),
        last: Number(mid.toFixed(4)), lastSize: Math.floor(this.random() * 100) + 1,
        volume: Math.floor(this.random() * 1_000_000), source: this.name, mode: "mock",
        eventTime: now, receivedAt: new Date().toISOString(), sequence, isSimulated: true,
      });
      const trade: MarketTrade = normalizeTrade({
        symbol: quote.symbol, exchange: quote.exchange, price: quote.last ?? mid,
        size: quote.lastSize ?? 1, source: this.name, mode: "mock",
        eventTime: now, receivedAt: new Date().toISOString(), sequence: ++this.seq, isSimulated: true,
      });
      this.lastMessageAt = now;
      this.emitter.emit("event", quote);
      this.emitter.emit("event", trade);
    }
  }
}
