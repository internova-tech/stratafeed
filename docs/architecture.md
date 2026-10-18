# StrataFeed Architecture — Phase 1

## Current scope
Phase 1 starts with a deterministic mock market simulator, normalized quote/trade contracts, a separate WebSocket worker, and server-side plan entitlement checks. It does not claim live exchange access. A real provider may be enabled only after implementing its adapter and confirming credentials, exchange coverage, delay status, and redistribution rights.

## Topology
Licensed provider or mock simulator -> adapter -> normalization/validation -> entitlement policy -> stream/cache -> WebSocket gateway -> browser quote board. Supabase Auth/PostgreSQL is the intended identity and entitlement source of truth; the Phase 1 standalone worker currently uses a configured gateway bearer token and a client-supplied plan only for local/mock development. Do not expose this development gateway publicly as a paid-service authorization boundary until a trusted signed identity/entitlement integration is added.

## Latency
Initial targets, not guarantees: normalization 1–5 ms; internal policy/publish 1–5 ms; cache and gateway fan-out 1–10 ms; client network 10–50 ms. Mock cadence defaults to one event batch per second. No claim of exchange-to-screen latency is made.

## Hosting
Next.js UI remains on Vercel. The long-running WebSocket worker must run on a host that supports persistent WebSocket servers (e.g. a managed container/service). Serverless Next.js routes are not used as the WebSocket server. Managed Redis is a follow-up integration for shared cache/fan-out when running multiple worker replicas.

## Scale plan
Single worker for simulator and development; add Redis-compatible pub/sub and shared latest-event cache before multiple replicas; add a durable bus and time-series storage only after provider throughput and retention requirements are measured. Apply backpressure, per-client subscription caps, bounded queues, connection limits, and p95/p99 latency monitoring before broad rollout.

## Cost
Mock development can run locally without paid market-data costs. Production infrastructure, Redis, data vendor plans, exchange licenses, redistribution and display fees are not priced here; obtain vendor quotes and contracts before selling live data.

## Data licensing
Every real provider adapter must declare allowed exchanges, asset classes, delivery mode, display/non-display rights, per-user reporting obligations, and whether redistribution is permitted. Never fall back from real-time to delayed data silently: emit a status change and label it clearly.
