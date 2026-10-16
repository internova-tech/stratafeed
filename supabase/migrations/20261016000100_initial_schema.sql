-- StrataFeed initial schema.
-- Apply to the intended Supabase project after reviewing its existing schema.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  full_name text not null default '' check (char_length(full_name) <= 120),
  tier text not null default 'free' check (tier in ('free', 'premium'))
);

create or replace function public.stratafeed_set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := pg_catalog.now(); return new; end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.stratafeed_set_updated_at();

create or replace function public.stratafeed_handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, tier)
  values (
    new.id,
    pg_catalog.left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.stratafeed_handle_new_user();

create or replace function public.stratafeed_protect_profile_tier()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.tier <> 'free' and (select auth.uid()) is not null then
      raise exception 'Only trusted operations can assign tiers';
    end if;
  elsif new.tier is distinct from old.tier and (select auth.uid()) is not null then
    raise exception 'Only trusted operations can change tiers';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_tier on public.profiles;
create trigger profiles_protect_tier before insert or update of tier on public.profiles
for each row execute function public.stratafeed_protect_profile_tier();

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  tickers text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint watchlists_ticker_count check (cardinality(tickers) <= 100),
  constraint watchlists_no_null_tickers check (array_position(tickers, null) is null)
);

create or replace function public.stratafeed_normalize_watchlist_tickers()
returns trigger language plpgsql set search_path = ''
as $$
declare normalized text[] := array[]::text[]; ticker text;
begin
  if cardinality(new.tickers) > 100 then raise exception 'A watchlist can contain at most 100 tickers'; end if;
  foreach ticker in array new.tickers loop
    ticker := pg_catalog.upper(pg_catalog.btrim(ticker));
    if ticker is null or ticker !~ '^[A-Z0-9][A-Z0-9._-]{0,19}$' then raise exception 'Invalid ticker symbol'; end if;
    if ticker = any(normalized) then raise exception 'Duplicate ticker symbol: %', ticker; end if;
    normalized := pg_catalog.array_append(normalized, ticker);
  end loop;
  new.tickers := normalized;
  new.name := pg_catalog.btrim(new.name);
  return new;
end;
$$;

drop trigger if exists watchlists_normalize_tickers on public.watchlists;
create trigger watchlists_normalize_tickers before insert or update of tickers, name on public.watchlists
for each row execute function public.stratafeed_normalize_watchlist_tickers();

create index if not exists watchlists_user_id_idx on public.watchlists(user_id);
create index if not exists watchlists_created_at_idx on public.watchlists(user_id, created_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null check (char_length(btrim(room_id)) between 1 and 100),
  sender_id uuid not null references auth.users(id) on delete cascade,
  message_text text not null check (char_length(btrim(message_text)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists messages_room_created_idx on public.messages(room_id, created_at desc);
create index if not exists messages_sender_id_idx on public.messages(sender_id);

create table if not exists public.market_cache (
  ticker text not null check (ticker ~ '^[A-Z0-9][A-Z0-9._-]{0,19}$'),
  open numeric(20,8), high numeric(20,8), low numeric(20,8), close numeric(20,8),
  volume numeric(30,8), "timestamp" timestamptz not null,
  constraint market_cache_pk primary key (ticker, "timestamp"),
  constraint market_cache_nonnegative_prices check (
    (open is null or open >= 0) and (high is null or high >= 0)
    and (low is null or low >= 0) and (close is null or close >= 0)
  ),
  constraint market_cache_nonnegative_volume check (volume is null or volume >= 0),
  constraint market_cache_high_low check (high is null or low is null or high >= low),
  constraint market_cache_high_open check (high is null or open is null or high >= open),
  constraint market_cache_high_close check (high is null or close is null or high >= close),
  constraint market_cache_low_open check (low is null or open is null or low <= open),
  constraint market_cache_low_close check (low is null or close is null or low <= close)
);
create index if not exists market_cache_timestamp_idx on public.market_cache("timestamp" desc);

alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.messages enable row level security;
alter table public.market_cache enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_insert_own_free on public.profiles;
create policy profiles_insert_own_free on public.profiles for insert to authenticated with check ((select auth.uid()) = id and tier = 'free');
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists watchlists_select_own on public.watchlists;
create policy watchlists_select_own on public.watchlists for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists watchlists_insert_own on public.watchlists;
create policy watchlists_insert_own on public.watchlists for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists watchlists_update_own on public.watchlists;
create policy watchlists_update_own on public.watchlists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists watchlists_delete_own on public.watchlists;
create policy watchlists_delete_own on public.watchlists for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists messages_select_authenticated on public.messages;
create policy messages_select_authenticated on public.messages for select to authenticated using (true);
drop policy if exists messages_insert_as_self on public.messages;
create policy messages_insert_as_self on public.messages for insert to authenticated with check ((select auth.uid()) = sender_id);

drop policy if exists market_cache_select_authenticated on public.market_cache;
create policy market_cache_select_authenticated on public.market_cache for select to authenticated using (true);

revoke all on public.profiles, public.watchlists, public.messages, public.market_cache from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.watchlists to authenticated;
grant select, insert on public.messages to authenticated;
grant select on public.market_cache to authenticated;

do $$
declare t text;
begin
  foreach t in array array['messages', 'market_cache'] loop
    if not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute pg_catalog.format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

commit;
