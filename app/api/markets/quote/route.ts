import { NextResponse } from "next/server";
import { z } from "zod";
import { getMarketQuote, MarketDataError } from "@/lib/market-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const symbolSchema = z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9._:/-]+$/);

export async function GET(request: Request) {
  const rawSymbol = new URL(request.url).searchParams.get("symbol") ?? "";
  const parsed = symbolSchema.safeParse(rawSymbol);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid ticker or exchange-qualified symbol." }, { status: 400 });
  }

  try {
    const quote = await getMarketQuote(parsed.data);
    return NextResponse.json({
      quote,
      provider: "Twelve Data",
      dataMode: quote.is_simulated ? "mock" : "provider",
      isSimulated: quote.is_simulated === true,
      freshness: quote.is_simulated ? "SIMULATED TEST DATA — NOT A REAL MARKET QUOTE" : "provider quote; real-time or delayed status depends on exchange entitlement",
      receivedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const status = error instanceof MarketDataError ? error.status : 502;
    const message = error instanceof MarketDataError ? error.message : "Market quote is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
