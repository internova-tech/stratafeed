# StrataFeed

A modular financial intelligence workspace built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui patterns, Supabase, and OpenAI.

## Product scope

StrataFeed is an independent terminal-style workspace for market monitoring, watchlists, charting, news context, portfolio analytics, research workflows, and AI-assisted synthesis. It does not include Bloomberg proprietary data, licensed news, exchange feeds, or trade execution unless separately integrated with authorized providers.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, RLS, Realtime, Edge Functions
- OpenAI API for structured research synthesis
- Vercel deployment

## Setup

1. Install Node.js 20.9+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set the required values.
4. Apply SQL migrations in `supabase/migrations` to your Supabase project.
5. Run `npm run dev`.
6. Run `npm run lint` and `npm run build` before deployment.

## Environment

See `.env.example`. Never commit secrets or expose the Supabase service-role key in browser code.

### Live market quotes

1. Create a Twelve Data account and choose a plan that covers the exchanges and real-time/delayed entitlements your product needs.
2. Add `MARKET_DATA_PROVIDER=twelvedata` and `TWELVE_DATA_API_KEY` to the server environment in Vercel (and `.env.local` for local development).
3. Use `/markets` to search symbols and view provider quotes. Quotes refresh every 30 seconds through server-side API routes; the API key is never sent to the browser.
4. Provider limits and exchange entitlements apply. This is not a consolidated feed for every exchange by default, and quotes may be delayed. Do not call a quote real-time unless the provider contract confirms that entitlement.

### Company research

- Visit `/research` to request a sourced public-company brief.
- Company research requires Supabase authentication and `OPENAI_API_KEY`. It uses web search and returns citation metadata when available.
- Supplier and customer relationships are labelled only when supported by public sources. A company's complete bill of materials, suppliers, direct customers, or end consumers may not be publicly disclosed; reports must state uncertainty rather than invent relationships.
- The platform does not provide personalized investment advice or trade execution.

## Important data note

Until a licensed market-data provider is configured, displayed sample figures are explicitly marked as demo data. They are not live quotes and must not be used for investment decisions.

## Roadmap

1. Secure database and RLS
2. Terminal shell and responsive workspace
3. Authenticated data access, watchlists, and Realtime
4. AI research endpoint with schema validation and rate limiting
5. Provider integrations, auditability, testing, and production hardening


## Phase 1: market-data simulator and gateway

The default market provider is `mock`. Quotes served in this mode are simulated test fixtures and are explicitly marked; they are not live market prices. The standalone WebSocket worker is intended for local testing and requires a persistent WebSocket-capable host when deployed. See [Phase 1 setup](docs/phase-1-setup.md) and [architecture](docs/architecture.md).

Run `npm run market:worker` to start the mock gateway and `npm test` for the Phase 1 unit tests. Live provider access is not enabled by this phase.
