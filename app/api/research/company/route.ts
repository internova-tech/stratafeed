import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  symbol: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9._:/-]+$/),
  companyName: z.string().trim().min(1).max(160),
}).strict();

type Citation = { title: string; url: string };
type OutputTextPart = { type?: string; annotations?: Array<{ type?: string; title?: string; url?: string }> };
type OutputItem = { type?: string; content?: OutputTextPart[] };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to run sourced company research." }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Company research is not configured. Add OPENAI_API_KEY to the server environment." }, { status: 503 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 5_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid ticker and company name." }, { status: 400 });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 55_000, maxRetries: 1 });
    const response = await client.responses.create({
      model: "gpt-4.1",
      tools: [{ type: "web_search" }],
      input: [
        "Prepare a rigorous, source-backed public-company intelligence brief.",
        `Company: ${parsed.data.companyName}; ticker / exchange: ${parsed.data.symbol}.`,
        "Use web search. Prioritize annual reports, regulatory filings, official company disclosures, investor presentations, and named supplier/customer disclosures; use reputable reporting only to supplement them.",
        "Cover: business segments and revenue drivers; direct suppliers and components/materials/services sourced; key customers and end markets; geography and facility concentration; competitors; material dependencies and concentration risks; recent disclosed changes.",
        "For suppliers and customers, separate CONFIRMED relationships disclosed by a primary source from REPORTED relationships and INFERRED industry relationships. Never turn an inference into a fact. If names are not disclosed, say 'not publicly disclosed' and describe only the supported category.",
        "Do not guess a company's end customers from its sector. Clearly distinguish direct customers from end consumers. State the date of research and any important gaps.",
        "Write a readable report with sections and concise bullets. Include clickable source URLs next to the claims they support. No investment recommendation or price prediction."
      ].join("\n\n"),
    });

    const report = response.output_text?.trim();
    if (!report) return NextResponse.json({ error: "Research provider returned no report." }, { status: 502 });

    const citations: Citation[] = [];
    const seen = new Set<string>();
    for (const item of response.output as OutputItem[]) {
      if (item.type !== "message" || !Array.isArray(item.content)) continue;
      for (const part of item.content) {
        if (part.type !== "output_text" || !Array.isArray(part.annotations)) continue;
        for (const annotation of part.annotations) {
          if (annotation.type !== "url_citation" || !annotation.url || seen.has(annotation.url)) continue;
          seen.add(annotation.url);
          citations.push({ title: annotation.title || annotation.url, url: annotation.url });
        }
      }
    }

    return NextResponse.json({
      company: parsed.data.companyName,
      symbol: parsed.data.symbol,
      report,
      citations: citations.slice(0, 30),
      generatedAt: new Date().toISOString(),
      disclaimer: "Research is informational, may be incomplete, and is not investment advice. Supply-chain disclosures vary by company and reporting period.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Company research failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Company research is temporarily unavailable. Please retry." }, { status: 502 });
  }
}
