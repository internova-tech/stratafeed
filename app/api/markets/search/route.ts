import { NextResponse } from "next/server";
import { z } from "zod";
import { MarketDataError, searchMarketSymbols } from "@/lib/market-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.string().trim().min(1).max(80).regex(/^[\p{L}\p{N} .&'()/_-]+$/u);

export async function GET(request: Request) {
  const rawQuery = new URL(request.url).searchParams.get("q") ?? "";
  const parsed = querySchema.safeParse(rawQuery);
  if (!parsed.success) return NextResponse.json({ error: "Enter a company name or ticker to search." }, { status: 400 });

  try {
    const results = await searchMarketSymbols(parsed.data);
    return NextResponse.json({ results, provider: "Twelve Data" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof MarketDataError ? error.status : 502;
    const message = error instanceof MarketDataError ? error.message : "Symbol search is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
