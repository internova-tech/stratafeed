import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "stratafeed",
    timestamp: new Date().toISOString(),
    integrations: {
      supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
      marketDataProviderConfigured: Boolean((process.env.MARKET_DATA_PROVIDER || "twelvedata") === "twelvedata" && (process.env.TWELVE_DATA_API_KEY || process.env.MARKET_DATA_API_KEY)),
      marketDataProvider: process.env.MARKET_DATA_PROVIDER || "twelvedata",
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
