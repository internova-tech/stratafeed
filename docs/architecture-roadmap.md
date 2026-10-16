# StrataFeed architecture roadmap

StrataFeed is an independent financial intelligence workspace. It is not a clone of Bloomberg's proprietary systems and does not include Bloomberg data, licensed research, or exchange execution without authorized integrations.

## Workstreams

### 1. Terminal workspace
- Responsive multi-pane dashboard and keyboard-first command search
- Customizable layouts, widgets, saved workspaces, themes, and shortcuts
- Asset search and cross-asset watchlists

### 2. Market data
- Provider adapter interface for equities, indices, FX, rates, commodities, funds, and digital assets
- Explicit quote timestamps, source attribution, exchange/session metadata, and delay indicators
- Realtime fanout through Supabase only when provider licensing permits it
- Staleness monitoring, provider quotas, backfill, and data-quality checks

### 3. Research and news
- Licensed news connectors and source links
- Entity/security mapping, deduplication, alerts, and saved research
- AI-generated summaries with strict schemas, source references, and uncertainty language
- Prompt-injection isolation for scraped content

### 4. Portfolio and analytics
- User-defined positions and transactions
- Performance attribution, exposure, sector allocation, benchmark comparison
- Risk analytics: volatility, drawdown, concentration, scenario analysis, and stress testing
- Clear assumptions and data timestamps for calculated metrics

### 5. Collaboration
- Authenticated room messaging with moderation, rate limiting, and auditability
- Shared watchlists and workspace permissions
- Notification preferences and alert delivery

### 6. Professional workflows
- Economic calendar and event impact views
- Earnings, estimates, corporate actions, and filings where licensed
- Fixed income and yield curves, derivatives analytics, and options surfaces where licensed data is available
- Order management and trade execution only through a separately authorized broker/execution integration with compliance controls

### 7. Security and operations
- Supabase Auth, RLS, least-privilege SQL grants, and server-only secrets
- MFA for privileged accounts, audit events, abuse throttles, and account recovery
- CI typecheck/lint/build, integration tests for RLS, migration review, monitoring, and incident runbooks
- Data retention, backups, privacy disclosures, and vendor licensing review

## Release gates

1. Development: demo data only, clearly labeled.
2. Private alpha: authenticated users, validated provider integration, RLS and API tests.
3. Beta: error monitoring, performance/load tests, source attribution, alert delivery and backup verification.
4. Production: provider licenses confirmed, security review complete, operational runbooks and rollback tested.

A feature is not considered live until its provider is configured, its data quality is tested, and its source/time metadata are visible to users.
