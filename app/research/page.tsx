"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, FileSearch, LoaderCircle, Search } from "lucide-react";

type Citation = { title: string; url: string };
type Report = { company: string; symbol: string; report: string; citations: Citation[]; generatedAt: string; disclaimer: string };

export default function CompanyResearchPage() {
  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSymbol = params.get("symbol") || "";
    const initialName = params.get("name") || "";
    if (initialSymbol) setSymbol(initialSymbol);
    if (initialName) setCompanyName(initialName);
  }, []);

  async function runResearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/research/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim(), companyName: companyName.trim() || symbol.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Research could not be generated.");
      setReport(data as Report);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Research is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07080b] p-4 text-[11px] text-gray-200 md:p-8">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-b border-[#252832] pb-5">
        <div className="flex items-center gap-3"><div className="border border-amber-400/40 bg-amber-300/10 p-2 text-amber-300"><FileSearch size={18}/></div><div><div className="text-sm font-black tracking-[.16em]">STRATA<span className="text-amber-300">FEED</span></div><div className="mt-1 text-[9px] tracking-[.18em] text-gray-500">COMPANY INTELLIGENCE</div></div></div>
        <Link href="/markets" className="flex items-center gap-2 text-gray-400 hover:text-amber-300"><ArrowLeft size={13}/> Global markets</Link>
      </header>
      <section className="mx-auto max-w-5xl">
        <div className="mt-7"><div className="text-[9px] tracking-[.2em] text-amber-300">RESEARCH / SUPPLY CHAIN</div><h1 className="mt-2 text-2xl font-bold">Company intelligence</h1><p className="mt-2 max-w-3xl text-[10px] leading-5 text-gray-500">Research public disclosures, suppliers, components, direct customers, end markets, competitors, and dependency risks. Relationships are labelled by evidence strength rather than guessed.</p></div>
        <form onSubmit={runResearch} className="mt-5 grid gap-3 border border-[#252832] bg-[#0e1015] p-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <label className="block"><span className="mb-2 block text-[9px] tracking-wider text-gray-500">TICKER / EXCHANGE</span><input required value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="e.g. AAPL or RELIANCE:NSE" className="w-full border border-[#333743] bg-black px-3 py-3 outline-none focus:border-amber-300"/></label>
          <label className="block"><span className="mb-2 block text-[9px] tracking-wider text-gray-500">COMPANY NAME</span><input required value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="e.g. Apple Inc." className="w-full border border-[#333743] bg-black px-3 py-3 outline-none focus:border-amber-300"/></label>
          <button disabled={loading} className="flex items-center justify-center gap-2 bg-amber-300 px-4 py-3 font-bold text-black hover:bg-amber-200 disabled:opacity-50">{loading ? <LoaderCircle size={13} className="animate-spin"/> : <Search size={13}/>} Research</button>
        </form>
        {error && <div role="status" className="mt-4 border border-amber-300/30 bg-amber-300/5 p-3 text-amber-100">{error}{error.includes("Sign in") && <div className="mt-2"><Link href="/login" className="underline">Sign in to continue</Link></div>}</div>}
        {loading && <div className="mt-5 flex items-center gap-2 text-gray-400"><LoaderCircle size={14} className="animate-spin"/> Searching public sources and preparing the brief…</div>}
        {report && <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
          <article className="border border-[#252832] bg-[#0e1015] p-4 md:p-6"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#252832] pb-4"><div><div className="text-[9px] tracking-[.2em] text-amber-300">SOURCE-BACKED BRIEF</div><h2 className="mt-2 text-lg font-bold">{report.company}</h2><div className="mt-1 text-[10px] text-gray-500">{report.symbol}</div></div><div className="text-right text-[9px] text-gray-500">Generated<br/>{new Date(report.generatedAt).toLocaleString()}</div></div><div className="whitespace-pre-wrap break-words pt-4 text-[11px] leading-7 text-gray-300">{report.report}</div><p className="mt-5 border-t border-[#252832] pt-4 text-[9px] leading-5 text-gray-500">{report.disclaimer}</p></article>
          <aside className="border border-[#252832] bg-[#0e1015] p-4"><h3 className="font-bold tracking-wider">SOURCE REGISTER</h3><p className="mt-2 text-[9px] leading-5 text-gray-500">Open the source material to verify the reported relationships and context.</p><div className="mt-4 space-y-2">{report.citations.map((citation) => <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 border border-[#252832] p-3 text-[10px] leading-5 text-gray-300 hover:border-amber-300/50 hover:text-amber-200"><ExternalLink size={12} className="mt-1 shrink-0"/><span className="break-words">{citation.title}</span></a>)}{report.citations.length === 0 && <p className="text-[10px] text-gray-500">No source links were returned in the citation metadata. Review the URLs included in the report text.</p>}</div></aside>
        </div>}
      </section>
    </main>
  );
}
