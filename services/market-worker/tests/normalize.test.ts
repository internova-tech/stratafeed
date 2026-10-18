import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQuote, normalizeTrade } from "../../../packages/market-core/src/normalize";
import { assertSubscriptionAllowed } from "../../../packages/market-core/src/entitlements";

const validQuote = {
  symbol: "aapl", exchange: "xnas", currency: "usd", bid: 99, ask: 101, last: 100,
  lastSize: 2, volume: 1000, source: "test", mode: "mock", eventTime: new Date().toISOString(),
  receivedAt: new Date().toISOString(), sequence: 1, isSimulated: true,
};

test("normalizes quote symbol and exchange and preserves simulation marker", () => {
  const quote = normalizeQuote(validQuote);
  assert.equal(quote.symbol, "AAPL");
  assert.equal(quote.exchange, "XNAS");
  assert.equal(quote.isSimulated, true);
});

test("rejects crossed quotes", () => {
  assert.throws(() => normalizeQuote({ ...validQuote, bid: 102, ask: 101 }), /Bid cannot exceed ask/);
});

test("rejects invalid timestamps and sequence numbers", () => {
  assert.throws(() => normalizeQuote({ ...validQuote, eventTime: "not-a-date" }), /timestamp/);
  assert.throws(() => normalizeQuote({ ...validQuote, sequence: 1.2 }), /sequence/);
});

test("normalizes trade and rejects negative sizes", () => {
  const trade = normalizeTrade({ symbol: "MSFT", exchange: "XNAS", price: 100, size: 3, source: "test", mode: "mock", eventTime: new Date().toISOString(), receivedAt: new Date().toISOString(), sequence: 1, isSimulated: true });
  assert.equal(trade.type, "trade");
  assert.throws(() => normalizeTrade({ symbol: "MSFT", exchange: "XNAS", price: 100, size: -1, source: "test", mode: "mock", eventTime: new Date().toISOString(), receivedAt: new Date().toISOString(), sequence: 1, isSimulated: true }), /size/);
});

test("free tier cannot request realtime or exceed symbol limit", () => {
  assert.throws(() => assertSubscriptionAllowed("free", ["AAPL"], "realtime"), /does not allow realtime/);
  assert.throws(() => assertSubscriptionAllowed("free", ["A", "B", "C", "D", "E", "F"], "mock"), /at most 5/);
});

test("PRO realtime entitlement is independent of UI", () => {
  assert.doesNotThrow(() => assertSubscriptionAllowed("pro", ["AAPL"], "realtime"));
});
