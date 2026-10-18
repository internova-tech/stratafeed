import { WebSocketServer, WebSocket } from "ws";
import { MockMarketDataAdapter } from "./adapters/mock";
import type { NormalizedMarketEvent } from "../../../packages/market-core/src/types";
import { assertSubscriptionAllowed, type Plan, type RequestedMode } from "../../../packages/market-core/src/entitlements";

const port = Number(process.env.MARKET_WS_PORT ?? 8787);
const host = process.env.MARKET_WS_HOST ?? "127.0.0.1";
const token = process.env.MARKET_WS_TOKEN;
const allowedOrigin = process.env.MARKET_WS_ALLOWED_ORIGIN;
const mode = process.env.MARKET_DATA_PROVIDER ?? "mock";

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("MARKET_WS_PORT must be a valid port");
if (mode !== "mock") throw new Error("Phase 1 worker only supports MARKET_DATA_PROVIDER=mock. Live providers are not configured.");

const adapter = new MockMarketDataAdapter(Number(process.env.MOCK_TICK_INTERVAL_MS ?? 1000));
await adapter.connect();
const wss = new WebSocketServer({ host, port, maxPayload: 16 * 1024, perMessageDeflate: false });
const clients = new Map<WebSocket, { plan: Plan; symbols: Set<string> }>();
const latest = new Map<string, NormalizedMarketEvent>();

adapter.onEvent((event) => {
  latest.set(event.symbol, event);
  for (const [socket, client] of clients) {
    if (socket.readyState === WebSocket.OPEN && client.symbols.has(event.symbol)) {
      try { socket.send(JSON.stringify({ type: "market_event", data: event })); } catch { socket.terminate(); }
    }
  }
});

wss.on("connection", (socket, request) => {
  const origin = request.headers.origin;
  if (allowedOrigin && origin !== allowedOrigin) { socket.close(1008, "Origin not allowed"); return; }
  if (token && request.headers.authorization !== `Bearer ${token}`) { socket.close(1008, "Unauthorized"); return; }
  const client = { plan: "free" as Plan, symbols: new Set<string>() };
  clients.set(socket, client);
  socket.send(JSON.stringify({ type: "hello", provider: adapter.name, simulated: true, message: "Mock data only; not exchange data." }));

  socket.on("message", (raw) => {
    if (raw.length > 8 * 1024) { socket.close(1009, "Message too large"); return; }
    let message: unknown;
    try { message = JSON.parse(raw.toString()); } catch { socket.send(JSON.stringify({ type: "error", error: "Invalid JSON" })); return; }
    if (!message || typeof message !== "object") { socket.send(JSON.stringify({ type: "error", error: "Invalid message" })); return; }
    const value = message as Record<string, unknown>;
    if (value.type === "subscribe") {
      if (!Array.isArray(value.symbols) || value.symbols.length < 1 || value.symbols.length > 1000 || !value.symbols.every((s) => typeof s === "string")) {
        socket.send(JSON.stringify({ type: "error", error: "symbols must be an array of 1-1000 strings" })); return;
      }
      const requestedPlan: Plan = value.plan === "pro" || value.plan === "enterprise" ? value.plan : "free";
      const requestedMode: RequestedMode = value.mode === "mock" ? "mock" : (value.mode === "delayed" || value.mode === "realtime" ? value.mode : "mock");
      if (requestedMode !== "mock") { socket.send(JSON.stringify({ type: "error", error: "This worker only supplies mock data; delayed and realtime feeds are not configured." })); return; }
      const symbols = value.symbols as string[];
      try {
        assertSubscriptionAllowed(requestedPlan, symbols, requestedMode);
        client.plan = requestedPlan;
        client.symbols = new Set(symbols.map((s) => s.toUpperCase().replace(/^DEMO\./, "")));
        void adapter.subscribe([...client.symbols]).catch(() => socket.send(JSON.stringify({ type: "error", error: "Subscription unavailable" })));
        socket.send(JSON.stringify({ type: "subscribed", symbols: [...client.symbols], mode: "mock", simulated: true }));
        for (const symbol of client.symbols) {
          const cached = latest.get(symbol);
          if (cached) socket.send(JSON.stringify({ type: "market_event", data: cached }));
        }
      } catch (error) {
        socket.send(JSON.stringify({ type: "error", error: error instanceof Error ? error.message : "Subscription rejected" }));
      }
      return;
    }
    if (value.type === "unsubscribe" && Array.isArray(value.symbols) && value.symbols.every((s) => typeof s === "string")) {
      for (const symbol of value.symbols as string[]) client.symbols.delete(symbol.toUpperCase());
      return;
    }
    socket.send(JSON.stringify({ type: "error", error: "Unsupported message type" }));
  });
  socket.on("close", () => clients.delete(socket));
  socket.on("error", () => clients.delete(socket));
});

function shutdown() {
  for (const socket of wss.clients) socket.close(1001, "Server shutting down");
  wss.close();
  void adapter.close().finally(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
console.log(`StrataFeed mock WebSocket gateway listening on ws://${host}:${port}`);
