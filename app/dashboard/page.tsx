"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import {
  Activity, Bell, Bookmark, BriefcaseBusiness, ChevronDown,
  Command, Globe2, LayoutDashboard, Newspaper, Search, Settings2, ShieldAlert,
  SlidersHorizontal, Sparkles, Star, X
} from "lucide-react";

type Asset = { ticker: string; name: string; price: string; change: number; volume: string; sector: string };

const assets: Asset[] = [
  { ticker: "SPX", name: "S&P 500", price: "5,842.47", change: 0.82, volume: "3.42B", sector: "INDEX" },
  { ticker: "NDX", name: "NASDAQ 100", price: "20,284.71", change: 1.14, volume: "1.87B", sector: "INDEX" },
  { ticker: "NVDA", name: "NVIDIA CORP", price: "142.87", change: 2.61, volume: "48.2M", sector: "TECH" },
  { ticker: "AAPL", name: "APPLE INC", price: "231.42", change: -0.38, volume: "31.6M", sector: "TECH" },
  { ticker: "MSFT", name: "MICROSOFT", price: "510.23", change: 0.54, volume: "18.1M", sector: "TECH" },
  { ticker: "TSLA", name: "TESLA INC", price: "341.80", change: -1.27, volume: "67.4M", sector: "AUTO" },
  { ticker: "EUR/USD", name: "EURO / US DOLLAR", price: "1.1642", change: 0.12, volume: "—", sector: "FX" },
  { ticker: "BTC/USD", name: "BITCOIN / USD", price: "109,482.00", change: 1.83, volume: "—", sector: "DIGITAL" },
];

const headlines = [
  { time: "14:32:08", tag: "MACRO", title: "Global markets weigh rate path as bond yields steady", source: "STRATA BRIEF", tone: "amber" },
  { time: "14:28:41", tag: "EQUITIES", title: "Technology shares lead broad-market advance in afternoon trade", source: "MARKET WIRE", tone: "green" },
  { time: "14:21:16", tag: "ENERGY", title: "Crude futures fluctuate as traders assess supply outlook", source: "COMMODITY DESK", tone: "red" },
  { time: "14:13:52", tag: "FX", title: "Dollar index consolidates; major currency pairs trade in tight ranges", source: "FX MONITOR", tone: "amber" },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Markets", icon: Globe2 },
  { label: "Watchlists", icon: Star },
  { label: "Portfolio", icon: BriefcaseBusiness },
  { label: "News & Research", icon: Newspaper },
  { label: "Risk Monitor", icon: ShieldAlert },
];

function Panel({ title, code, children, className = "" }: { title: string; code?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 border border-terminal-border bg-terminal-panel ${className}`}>
      <div className="flex h-9 items-center justify-between border-b border-terminal-border px-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-gray-200">
          <span className="h-3 w-[2px] bg-terminal-amber" />{title}
        </div>
        {code && <span className="text-[9px] tracking-wider text-terminal-muted">{code}</span>}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Sparkline({ down = false }: { down?: boolean }) {
  const points = down
    ? "0,16 12,12 24,17 36,9 48,13 60,5 72,10 84,15 96,8 108,12 120,3"
    : "0,18 12,13 24,16 36,8 48,11 60,5 72,10 84,4 96,8 108,2 120,5";
  return <svg viewBox="0 0 120 22" className="h-6 w-full" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={down ? "#FF3333" : "#00FF66"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>;
}

function MarketChart() {
  const values = [36, 42, 39, 48, 45, 54, 50, 47, 61, 57, 65, 60, 68, 63, 73, 70, 79, 74, 84, 81, 91, 86, 96, 90, 102, 98, 110, 104, 114, 108, 119, 114, 125, 120, 131, 127, 138, 132, 143, 139, 150, 145, 154, 148, 160, 154, 166, 160];
  const line = values.map((y, i) => `${i * 8},${170 - y}`).join(" ");
  const area = `0,170 ${line} 376,170`;
  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-xl font-bold text-white">5,842.47 <span className="text-xs font-normal text-terminal-bullish">+0.82%</span></div><div className="mt-1 text-[9px] text-terminal-muted">S&P 500 INDEX · DEMO SNAPSHOT</div></div>
        <div className="flex gap-1">{["1D", "1W", "1M", "3M", "1Y", "MAX"].map((range, i) => <button key={range} className={`px-2 py-1 text-[9px] ${i === 0 ? "bg-terminal-amber text-black" : "text-gray-500 hover:text-white"}`}>{range}</button>)}</div>
      </div>
      <div className="relative h-[210px] w-full overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-between">{[0,1,2,3,4].map(n => <div key={n} className="border-t border-terminal-border/70" />)}</div>
        <svg viewBox="0 0 376 170" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00FF66" stopOpacity=".18"/><stop offset="100%" stopColor="#00FF66" stopOpacity="0"/></linearGradient></defs>
          <polygon points={area} fill="url(#chartFill)" />
          <polyline points={line} fill="none" stroke="#00FF66" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[9px] text-terminal-muted"><span>09:30</span><span>11:00</span><span>12:30</span><span>14:00</span><span>16:00</span></div>
      <div className="mt-3 flex gap-4 border-t border-terminal-border pt-3 text-[9px]"><span className="text-terminal-muted">OPEN <b className="ml-1 text-gray-200">5,795.31</b></span><span className="text-terminal-muted">HIGH <b className="ml-1 text-terminal-bullish">5,861.20</b></span><span className="text-terminal-muted">LOW <b className="ml-1 text-gray-200">5,778.64</b></span></div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [watchOnly, setWatchOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>(["NVDA", "SPX", "BTC/USD"]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const filteredAssets = useMemo(() => assets.filter(a => (a.ticker + " " + a.name + " " + a.sector).toLowerCase().includes(query.toLowerCase()) && (!watchOnly || saved.includes(a.ticker))), [query, watchOnly, saved]);

  const toggleSaved = (ticker: string) => setSaved(old => old.includes(ticker) ? old.filter(t => t !== ticker) : [...old, ticker]);
  const submitCommand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (value) setActiveNav("Markets");
    setCommandOpen(false);
  };
  const askDemo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAiAnswer("AI analysis is not connected yet. Phase 4 will add a server-side OpenAI endpoint with schema validation. No investment recommendation has been generated.");
  };

  return (
    <main className="min-h-screen bg-terminal-black text-[11px]">
      <header className="sticky top-0 z-30 border-b border-terminal-border bg-black/95 backdrop-blur">
        <div className="flex min-h-14 items-center gap-4 px-3 lg:px-5">
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center border border-terminal-amber/60 bg-terminal-amber/10 text-terminal-amber"><Activity size={17}/></div>
            <div><div className="text-sm font-black tracking-[.16em] text-white">STRATA<span className="text-terminal-amber">FEED</span></div><div className="text-[8px] tracking-[.22em] text-terminal-muted">FINANCIAL INTELLIGENCE</div></div>
          </div>
          <div className="hidden h-8 flex-1 items-center border border-terminal-border bg-terminal-panel px-3 md:flex">
            <Command size={13} className="mr-2 text-terminal-amber"/><form onSubmit={submitCommand} className="flex w-full items-center"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticker, company, market, or command..." className="w-full bg-transparent text-[10px] text-white outline-none placeholder:text-gray-600"/><span className="text-[9px] text-gray-600">ENTER</span></form>
          </div>
          <div className="ml-auto flex items-center gap-3 text-terminal-muted"><span className="hidden text-[9px] sm:inline">DATA MODE: <b className="text-terminal-amber">DEMO</b></span><button aria-label="Open command search" onClick={()=>setCommandOpen(true)} className="p-1 hover:text-terminal-amber"><Search size={16}/></button><button aria-label="Notifications" className="relative p-1 hover:text-terminal-amber"><Bell size={16}/><i className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-terminal-amber"/></button><button aria-label="Settings" className="p-1 hover:text-white"><Settings2 size={16}/></button><Link href="/login" aria-label="Sign in or manage account" className="flex h-7 items-center justify-center border border-terminal-border bg-terminal-surface px-2 text-[9px] text-terminal-amber hover:border-terminal-amber">SIGN IN</Link></div>
        </div>
        <div className="flex h-7 items-center gap-5 overflow-hidden border-t border-terminal-border bg-[#08090c] px-3 lg:px-5">
          <span className="shrink-0 text-[9px] font-bold tracking-widest text-terminal-amber">MARKET PULSE</span>
          {assets.slice(0,6).map(a=><div key={a.ticker} className="flex shrink-0 items-center gap-2 text-[9px]"><span className="text-gray-400">{a.ticker}</span><span className="text-gray-200">{a.price}</span><span className={a.change>=0?"text-terminal-bullish":"text-terminal-bearish"}>{a.change>0?"+":""}{a.change.toFixed(2)}%</span></div>)}
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-84px)] grid-cols-1 lg:grid-cols-[184px_minmax(0,1fr)]">
        <aside className="border-b border-terminal-border bg-[#07080b] p-3 lg:border-b-0 lg:border-r">
          <div className="mb-3 px-2 text-[9px] font-bold tracking-[.18em] text-gray-600">WORKSPACE</div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {navItems.map(({label, icon: Icon})=><button key={label} onClick={()=>setActiveNav(label)} className={`flex shrink-0 items-center gap-3 border-l-2 px-3 py-2.5 text-left text-[10px] transition ${activeNav===label?"border-terminal-amber bg-terminal-amber/10 text-terminal-amber":"border-transparent text-gray-500 hover:bg-white/[.03] hover:text-gray-200"}`}><Icon size={14}/>{label}</button>)}
          </nav>
          <div className="mt-6 hidden lg:block"><div className="mb-2 px-2 text-[9px] font-bold tracking-[.18em] text-gray-600">MY WATCHLIST</div>{saved.map(t=><div key={t} className="flex items-center justify-between px-2 py-2 text-[10px] text-gray-400"><span>{t}</span><button onClick={()=>toggleSaved(t)} aria-label={`Remove ${t} from watchlist`}><X size={11} className="hover:text-terminal-bearish"/></button></div>)}<button onClick={()=>setWatchOnly(!watchOnly)} className="mt-2 flex w-full items-center gap-2 px-2 py-2 text-[9px] text-terminal-amber hover:bg-white/[.03]"><SlidersHorizontal size={12}/>{watchOnly?"Show all assets":"Filter to watchlist"}</button></div>
          <div className="mt-8 hidden border border-terminal-border p-3 lg:block"><div className="mb-2 flex items-center gap-2 text-terminal-amber"><ShieldAlert size={13}/><span className="text-[9px] font-bold">SYSTEM STATUS</span></div><div className="space-y-2 text-[9px] text-gray-500"><div className="flex justify-between"><span>Market feed</span><span className="text-terminal-amber">DEMO</span></div><div className="flex justify-between"><span>Realtime</span><span>NOT CONNECTED</span></div><div className="flex justify-between"><span>AI engine</span><span>STANDBY</span></div></div></div>
        </aside>

        <div className="min-w-0 p-3 lg:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><div className="mb-1 text-[9px] tracking-[.2em] text-terminal-amber">WORKSPACE / {activeNav.toUpperCase()}</div><h1 className="text-xl font-bold tracking-tight text-white">{activeNav==="Overview"?"Market overview":activeNav}</h1><p className="mt-1 text-[10px] text-gray-600">Global markets at a glance. Demo data is illustrative, not live market information.</p></div><div className="flex items-center gap-2 text-[9px] text-gray-500"><span className="h-1.5 w-1.5 rounded-full bg-terminal-amber"/>DEMO SNAPSHOT <ChevronDown size={12}/></div></div>

          <div className="mb-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
            {[{label:"S&P 500",value:"5,842.47",change:"+0.82%",up:true},{label:"NASDAQ 100",value:"20,284.71",change:"+1.14%",up:true},{label:"US 10Y YIELD",value:"4.182%",change:"−0.6 bps",up:true},{label:"DXY INDEX",value:"98.274",change:"−0.21%",up:false}].map(k=><div key={k.label} className="border border-terminal-border bg-terminal-panel p-3"><div className="text-[9px] tracking-wider text-gray-500">{k.label}</div><div className="mt-2 text-lg font-bold text-gray-100">{k.value}</div><div className={`mt-1 text-[10px] ${k.up?"text-terminal-bullish":"text-terminal-bearish"}`}>{k.change} <span className="text-gray-600">TODAY</span></div></div>)}
          </div>

          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
            <Panel title="Index performance" code="CHART / DEMO"><MarketChart/></Panel>
            <Panel title="Market headlines" code="NEWS / SAMPLE">
              <div className="space-y-0">{headlines.map((h,i)=><article key={h.time} className={`border-b border-terminal-border py-3 last:border-0 ${i===0?"pt-0":""}`}><div className="mb-1.5 flex items-center gap-2 text-[9px]"><span className="text-gray-600">{h.time}</span><span className={h.tone==="green"?"text-terminal-bullish":h.tone==="red"?"text-terminal-bearish":"text-terminal-amber"}>{h.tag}</span></div><h3 className="text-[10px] leading-relaxed text-gray-200">{h.title}</h3><div className="mt-1.5 text-[8px] tracking-wider text-gray-600">{h.source} · SAMPLE HEADLINE</div></article>)}</div>
            </Panel>
            <Panel title="Asset monitor" code="WATCH / UNIVERSE" className="2xl:col-span-2">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 border border-terminal-border bg-black px-2 py-1.5"><Search size={12} className="text-gray-600"/><input aria-label="Filter assets" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter symbols..." className="w-40 bg-transparent text-[10px] outline-none placeholder:text-gray-700"/></div><button onClick={()=>setWatchOnly(!watchOnly)} className={`flex items-center gap-2 border px-2 py-1.5 text-[9px] ${watchOnly?"border-terminal-amber text-terminal-amber":"border-terminal-border text-gray-500"}`}><SlidersHorizontal size={12}/>{watchOnly?"WATCHLIST ONLY":"ALL ASSETS"}</button></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[650px] border-collapse text-left"><thead><tr className="border-y border-terminal-border text-[9px] text-gray-600"><th className="py-2 font-normal">SYMBOL / ASSET</th><th className="py-2 text-right font-normal">LAST PRICE</th><th className="py-2 text-right font-normal">CHANGE %</th><th className="py-2 text-right font-normal">VOLUME</th><th className="py-2 text-right font-normal">TREND</th><th className="py-2 text-right font-normal">SAVE</th></tr></thead><tbody>{filteredAssets.map(a=><tr key={a.ticker} className="border-b border-terminal-border/70 hover:bg-white/[.025]"><td className="py-3"><div className="font-bold text-gray-200">{a.ticker}</div><div className="mt-1 text-[9px] text-gray-600">{a.name}</div></td><td className="py-3 text-right text-gray-200">{a.price}</td><td className={`py-3 text-right ${a.change>=0?"text-terminal-bullish":"text-terminal-bearish"}`}>{a.change>0?"+":""}{a.change.toFixed(2)}%</td><td className="py-3 text-right text-gray-500">{a.volume}</td><td className="w-28 py-3 pl-4"><Sparkline down={a.change<0}/></td><td className="py-3 text-right"><button onClick={()=>toggleSaved(a.ticker)} aria-label={saved.includes(a.ticker)?`Unsave ${a.ticker}`:`Save ${a.ticker}`} className={saved.includes(a.ticker)?"text-terminal-amber":"text-gray-700 hover:text-terminal-amber"}><Bookmark size={13}/></button></td></tr>)}</tbody></table>{filteredAssets.length===0&&<div className="py-8 text-center text-[10px] text-gray-600">No assets match this filter.</div>}</div>
            </Panel>
            <Panel title="Order book" code="L2 / MOCK DATA">
              <div className="grid grid-cols-3 pb-2 text-[9px] text-gray-600"><span>SIZE</span><span className="text-center">BID</span><span className="text-right">ASK</span></div>
              {[["2,400","5,842.40","5,842.52","45%"],["1,820","5,842.31","5,842.61","58%"],["3,100","5,842.22","5,842.70","36%"],["960","5,842.14","5,842.83","68%"],["1,540","5,842.05","5,842.95","41%"]].map((r,i)=><div key={i} className="relative grid grid-cols-3 border-t border-terminal-border py-2 text-[10px]"><div className="absolute inset-y-0 left-0 bg-terminal-bullish/[.06]" style={{width:r[3]}}/><span className="relative text-gray-500">{r[0]}</span><span className="relative text-center text-terminal-bullish">{r[1]}</span><span className="relative text-right text-terminal-bearish">{r[2]}</span></div>)}
              <div className="mt-2 border-t border-terminal-border pt-2 text-[8px] text-gray-600">Illustrative order book · Not connected to an exchange</div>
            </Panel>
            <Panel title="AI research desk" code="STRATA INTELLIGENCE">
              <div className="mb-3 flex items-center gap-2 text-terminal-amber"><Sparkles size={15}/><span className="text-[10px] font-bold">Ask a market question</span></div>
              <p className="mb-3 text-[10px] leading-relaxed text-gray-500">Prepare a structured research brief from market data and news. The live OpenAI endpoint will be added in a later phase.</p>
              <form onSubmit={askDemo} className="space-y-2"><textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} maxLength={500} rows={3} placeholder="e.g. Summarize the key risks affecting semiconductor stocks..." className="w-full resize-y border border-terminal-border bg-black p-2 text-[10px] outline-none placeholder:text-gray-700 focus:border-terminal-amber/60"/><button className="flex w-full items-center justify-center gap-2 bg-terminal-amber px-3 py-2 text-[10px] font-bold text-black hover:bg-[#ffd05a]"><Sparkles size={12}/>PREPARE ANALYSIS</button></form>
              {aiAnswer&&<div role="status" className="mt-3 border border-terminal-border p-2 text-[9px] leading-relaxed text-gray-400">{aiAnswer}</div>}
            </Panel>
          </div>
          <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-terminal-border pt-3 text-[8px] tracking-wider text-gray-700"><span>STRATAFEED TERMINAL · BUILD 0.1.0</span><span>DEMO DATA ONLY · NOT INVESTMENT ADVICE</span><span className="flex items-center gap-1"><Activity size={10}/> SYSTEM READY</span></footer>
        </div>
      </div>

      {commandOpen&&<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-[15vh]" onClick={()=>setCommandOpen(false)}><div className="w-full max-w-xl border border-terminal-border bg-terminal-panel shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-center gap-3 border-b border-terminal-border p-3"><Search size={15} className="text-terminal-amber"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setActiveNav("Markets");setCommandOpen(false)}}} placeholder="Search tickers, companies, workspaces..." className="flex-1 bg-transparent text-[11px] outline-none"/><button onClick={()=>setCommandOpen(false)} aria-label="Close search"><X size={15}/></button></div><div className="p-3 text-[9px] text-gray-600">QUICK ACTIONS</div>{["Overview","Markets","Watchlists","Portfolio","News & Research","Risk Monitor"].map(item=><button key={item} onClick={()=>{setActiveNav(item);setCommandOpen(false)}} className="flex w-full items-center justify-between border-t border-terminal-border px-4 py-3 text-left text-[10px] text-gray-300 hover:bg-white/[.04]"><span>{item}</span><span className="text-gray-700">OPEN WORKSPACE ↵</span></button>)}</div></div>}
    </main>
  );
}
