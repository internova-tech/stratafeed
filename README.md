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

## Important data note

Until a licensed market-data provider is configured, displayed sample figures are explicitly marked as demo data. They are not live quotes and must not be used for investment decisions.

## Roadmap

1. Secure database and RLS
2. Terminal shell and responsive workspace
3. Authenticated data access, watchlists, and Realtime
4. AI research endpoint with schema validation and rate limiting
5. Provider integrations, auditability, testing, and production hardening
