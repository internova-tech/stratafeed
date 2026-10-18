# Phase 1 setup

## Requirements
- Node.js 20.9+ and npm.
- Current StrataFeed dependencies installed.
- For the standalone WebSocket worker, the added `ws` and `tsx` packages.
- A persistent WebSocket-capable worker host for deployed gateway use. Vercel remains the frontend host.

## Environment
Copy `.env.example` to `.env.local` for the web app. For the worker, set:
- `MARKET_DATA_PROVIDER=mock`
- `MARKET_WS_HOST=127.0.0.1` (local-only default)
- `MARKET_WS_PORT=8787`
- `MARKET_WS_TOKEN` (set a long random secret if exposing the gateway beyond localhost)
- `MARKET_WS_ALLOWED_ORIGIN=http://localhost:3000`
- `MOCK_TICK_INTERVAL_MS=1000`

Do not use mock events as actual market quotes. All simulator events carry `mode=mock` and `isSimulated=true`.

## Run
```sh
npm install
npm run dev
```
In another terminal:
```sh
npm run market:worker
```
The worker binds to localhost by default. A local WebSocket client may connect to `ws://127.0.0.1:8787` and send:
```json
{"type":"subscribe","symbols":["AAPL","MSFT"],"plan":"free","mode":"mock"}
```
The returned quotes are generated test values and are not real prices.

## Checks
```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Managed streaming note
The current worker uses in-process memory and WebSocket fan-out to make the mock path testable. Redis, cross-replica pub/sub, authenticated user identity from Supabase, and production-grade subscription billing enforcement are not yet integrated. Do not expose the mock gateway as a public production data service.
