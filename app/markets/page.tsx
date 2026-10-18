"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Activity, ArrowLeft, ArrowUpRight, RefreshCw, Search, Star } from "lucide-react";

type Quote = {
  symbol: string; name?: string; exchange?: string; currency?: string; datetime?: string;
  close?: string; change?: string; percent_change?: string; volume?: string; is_market_open?: boolean;
};
type SearchResult = { symbol: string; instrument_name?: string; exchange?: string; country?: string; currency?: string; instrument_type?: string };

const initialSymbols = ["AAPL", "MSFT", "NVDA"];

export default function MarketsPage() {
  const [symbols, setSymbols] = useState<string[]>(initialSymbols);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const settled = await Promise.all(symbols.map(async (symbol) => {
      try {
        const response = await fetch(`/api/markets/quote?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Could not load ${symbol}`);
        return { symbol, quote: data.quote as Quote, error: "" };
      } catch (cause) {
        return { symbol, quote: null, error: cause instanceof Error ? cause.message : "Quote unavailable" };
      }
    }));
    const nextQuotes: Record<string, Quote> = {};
    const failures: string[] = [];
    for (const item of settled) {
      if (item.quote) nextQuotes[item.symbol] = item.quote;
      if (item.error) failures.push(item.error);
    }
    setQuotes((current) => ({ ...current, ...nextQuotes }));
    if (failures.length) setError(failures[0]);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }, [symbols]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchError("");
    setResults([]);
    const term = query.trim();
    if (!term) return;
    try {
      const response = await fetch(`/api/markets/search?q=${encodeURIComponent(term)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed.");
      setResults(data.results as SearchResult[]);
      if (!data.results?.length) setSearchError("No matching instruments were returned.");
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "Search is unavailable.");
    }
  }

  function addSymbol(symbol: string) {
    setSymbols((current) => current.includes(symbol) ? current : [...current, symbol].slice(-12));
    setResults([]);
    setQuery(symbol);
  }

  return (
    <main className="min-h-screen bg-[#07080b] p-4 text-[11px] text-gray-200 md:p-8">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-b border-[#252832] pb-5">
        <div className="flex items-center gap-3"><div className="border border-amber-400/40 bg-amber-300/10 p-2 text-amber-300"><Activity size={18}/></div><div><div className="text-sm font-black tracking-[.16em]">STRATA<span className="text-amber-300">FEED</span></div><div className="mt-1 text-[9px] tracking-[.18em] text-gray-500">GLOBAL MARKETS</div></div></div>
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-amber-300"><ArrowLeft size={13}/> Terminal overview</Link>
      </header>
      <section className="mx-auto max-w-6xl">
        <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><div className="text-[9px] tracking-[.2em] text-amber-300">MARKET DATA / QUOTES</div><h1 className="mt-2 text-2xl font-bold">Global market monitor</h1><p className="mt-2 max-w-2xl text-[10px] leading-5 text-gray-500">Search listed instruments across supported markets. Quotes refresh every 30 seconds through the server-side provider connection.</p></div><button onClick={() => void refresh()} disabled={loading} className="flex items-center gap-2 border border-[#333743] px-3 py-2 text-[10px] hover:border-amber-300 disabled:opacity-50"><RefreshCw size={12} className={loading ? "animate-spin" : ""}/> Refresh now</button></div>
        <div className="mt-5 border border-[#252832] bg-[#0e1015] p-4">
          <form onSubmit={search} className="flex flex-wrap gap-2"><div className="flex min-w-[220px] flex-1 items-center gap-2 border border-[#333743] bg-black px-3"><Search size={13} className="text-gray-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company name or ticker (e.g. RELIANCE)" className="w-full bg-transparent py-3 text-[11px] outline-none placeholder:text-gray-600"/></div><button className="bg-amber-300 px-4 py-2 font-bold text-black hover:bg-amber-200">Search instruments</button></form>
          {searchError && <p role="status" className="mt-3 text-[10px] text-rose-300">{searchError}</p>}
          {results.length > 0 && <div className="mt-3 divide-y divide-[#252832] border border-[#252832]">{results.map((result) => <div key={`${result.symbol}-${result.exchange}`} className="flex flex-wrap items-center justify-between gap-3 p-3"><div><div className="font-bold text-white">{result.symbol} <span className="ml-2 font-normal text-gray-400">{result.instrument_name}</span></div><div className="mt-1 text-[9px] text-gray-500">{[result.exchange, result.country, result.currency, result.instrument_type].filter(Boolean).join(" · ")}</div></div><button onClick={() => addSymbol(result.symbol)} className="flex items-center gap-1 text-amber-300 hover:text-amber-200"><Star size={12}/> Watch</button></div>)}</div>}
        </div>
        {error && <div role="status" className="mt-4 border border-amber-300/30 bg-amber-300/5 p-3 text-[10px] text-amber-100"><strong>Feed status:</strong> {error}<p className="mt-2 text-gray-400">Configure TWELVE_DATA_API_KEY on the server. Real-time or delayed delivery depends on your provider plan and each exchange&apos;s entitlement. No demo prices are substituted.</p></div>}
        <div className="mt-5 overflow-x-auto border border-[#252832] bg-[#0e1015]">
          <div className="flex items-center justify-between border-b border-[#252832] p-3"><div className="font-bold tracking-wider">WATCHLIST QUOTES</div><div className="text-[9px] text-gray-500">{lastUpdated ? `Checked ${lastUpdated}` : "Waiting for provider"}</div></div>
          <table className="w-full min-w-[700px] border-collapse text-left"><thead><tr className="border-b border-[#252832] text-[9px] text-gray-500"><th className="p-3 font-normal">INSTRUMENT</th><th className="p-3 text-right font-normal">LAST</th><th className="p-3 text-right font-normal">CHANGE</th><th className="p-3 text-right font-normal">VOLUME</th><th className="p-3 text-right font-normal">EXCHANGE</th><th className="p-3 text-right font-normal">QUOTE TIME</th><th className="p-3 text-right font-normal">RESEARCH</th></tr></thead><tbody>{symbols.map((symbol) => { const quote = quotes[symbol]; const positive = Number(quote?.change ?? 0) >= 0; return <tr key={symbol} className="border-b border-[#252832] last:border-0 hover:bg-white/[.02]"><td className="p-3"><div className="font-bold text-white">{symbol}</div><div className="mt-1 text-[9px] text-gray-500">{quote?.name || "Awaiting quote"}</div></td><td className="p-3 text-right tabular-nums">{quote?.close ? `${quote.currency || ""} ${quote.close}` : "—"}</td><td className={`p-3 text-right tabular-nums ${quote ? positive ? "text-emerald-300" : "text-rose-300" : "text-gray-600"}`}>{quote?.change ? `${positive ? "+" : ""}${quote.change} (${quote.percent_change || "—"}%)` : "—"}</td><td className="p-3 text-right text-gray-400">{quote?.volume || "—"}</td><td className="p-3 text-right text-gray-400">{quote?.exchange || "—"}</td><td className="p-3 text-right text-gray-500">{quote?.datetime || "—"}</td><td className="p-3 text-right"><Link href={`/research?symbol=${encodeURIComponent(symbol)}&name=${encodeURIComponent(quote?.name || symbol)}`} className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200">Profile <ArrowUpRight size={11}/></Link></td></tr>; })}</tbody></table>
          {symbols.length === 0 && <div className="p-8 text-center text-gray-500">Search for a company and add it to the watchlist.</div>}
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-3 text-[9px] leading-5 text-gray-600"><span>Provider: Twelve Data · Server-side API key · 30-second refresh</span><span>Quotes may be real-time or delayed depending on exchange entitlement.</span></div>
      </section>
    </main>
  );
}
