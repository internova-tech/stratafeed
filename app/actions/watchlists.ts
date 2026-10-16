"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const tickerSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._-]{0,19}$/);
const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tickers: z.array(tickerSchema).max(100).default([]),
}).strict().refine((data) => new Set(data.tickers).size === data.tickers.length, {
  message: "Tickers must be unique.",
  path: ["tickers"],
});

export async function listWatchlists() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false as const, error: "Sign in to view watchlists." };

  const { data, error } = await supabase
    .from("watchlists")
    .select("id, name, tickers, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { ok: false as const, error: "Could not load watchlists." };
  return { ok: true as const, data };
}

export async function createWatchlist(input: unknown) {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid watchlist details." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false as const, error: "Sign in to create a watchlist." };

  const { data, error } = await supabase
    .from("watchlists")
    .insert({ user_id: user.id, name: parsed.data.name, tickers: parsed.data.tickers })
    .select("id, name, tickers, created_at")
    .single();

  if (error) return { ok: false as const, error: "Could not create watchlist." };
  revalidatePath("/dashboard");
  return { ok: true as const, data };
}

export async function updateWatchlist(input: unknown) {
  const schema = createSchema.extend({ id: z.string().uuid() }).strict();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid watchlist details." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false as const, error: "Sign in to update a watchlist." };

  const { data, error } = await supabase
    .from("watchlists")
    .update({ name: parsed.data.name, tickers: parsed.data.tickers })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id, name, tickers, created_at")
    .maybeSingle();

  if (error || !data) return { ok: false as const, error: "Watchlist not found or update denied." };
  revalidatePath("/dashboard");
  return { ok: true as const, data };
}
