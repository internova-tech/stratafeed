import test from "node:test";
import assert from "node:assert/strict";
import { MockMarketDataAdapter } from "../src/adapters/mock";

test("mock adapter emits explicitly simulated quote and trade events", async () => {
  const adapter = new MockMarketDataAdapter(100, () => 0.5);
  const events: Array<{ type: string; isSimulated: boolean; mode: string }> = [];
  const off = adapter.onEvent((event) => events.push(event));
  await adapter.connect();
  await adapter.subscribe(["AAPL"]);
  await new Promise((resolve) => setTimeout(resolve, 140));
  await adapter.close();
  off();
  assert.ok(events.some((event) => event.type === "quote"));
  assert.ok(events.some((event) => event.type === "trade"));
  assert.ok(events.every((event) => event.isSimulated && event.mode === "mock"));
  assert.equal(adapter.health().connected, false);
});

test("mock adapter rejects invalid subscription symbols", async () => {
  const adapter = new MockMarketDataAdapter(100);
  await adapter.connect();
  await assert.rejects(adapter.subscribe(["bad symbol"]), /Invalid symbol/);
  await adapter.close();
});
