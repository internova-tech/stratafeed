"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type MarketSnapshot = {
  ticker: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  timestamp: string;
};

export function useStrataFeedRealtime(initial: MarketSnapshot[] = []) {
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>(initial);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let client: ReturnType<typeof createClient>;
    try {
      client = createClient();
    } catch {
      setConnected(false);
      return;
    }

    const channel = client
      .channel("stratafeed-market-cache")
      .on("postgres_changes", { event: "*", schema: "public", table: "market_cache" }, (payload) => {
        if (!active || payload.eventType === "DELETE" || !payload.new) return;
        const row = payload.new as MarketSnapshot;
        setSnapshots((current) => {
          const withoutSameKey = current.filter((item) => !(item.ticker === row.ticker && item.timestamp === row.timestamp));
          return [row, ...withoutSameKey].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 500);
        });
      })
      .subscribe((status) => {
        if (active) setConnected(status === "SUBSCRIBED");
      });

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, []);

  return { snapshots, connected };
}
