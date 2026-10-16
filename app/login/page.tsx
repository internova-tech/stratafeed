"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace("/dashboard");
        router.refresh();
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (authError) throw authError;
        if (!data.session) {
          setNotice("Account created. Check your email to confirm your address, then sign in.");
        } else {
          router.replace("/dashboard");
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-black px-4 py-10">
      <div className="w-full max-w-md border border-terminal-border bg-terminal-panel">
        <div className="flex items-center justify-between border-b border-terminal-border p-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white"><ArrowLeft size={13}/> BACK TO TERMINAL</Link>
          <span className="text-[9px] tracking-widest text-terminal-amber">SECURE ACCESS</span>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center border border-terminal-amber/50 bg-terminal-amber/10 text-terminal-amber"><Activity size={20}/></div><div><div className="text-lg font-black tracking-[.13em] text-white">STRATA<span className="text-terminal-amber">FEED</span></div><div className="mt-1 text-[9px] tracking-widest text-gray-600">MARKET INTELLIGENCE TERMINAL</div></div></div>
          <h1 className="text-xl font-bold text-white">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">Sign in to save your workspace and access authenticated research tools.</p>
          <div className="mt-5 grid grid-cols-2 border border-terminal-border p-1"><button onClick={() => {setMode("signin");setError("");setNotice("");}} className={`py-2 text-[10px] ${mode === "signin" ? "bg-terminal-amber text-black font-bold" : "text-gray-500"}`}>SIGN IN</button><button onClick={() => {setMode("signup");setError("");setNotice("");}} className={`py-2 text-[10px] ${mode === "signup" ? "bg-terminal-amber text-black font-bold" : "text-gray-500"}`}>CREATE ACCOUNT</button></div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "signup" && <label className="block text-[10px] text-gray-400">FULL NAME<input value={fullName} onChange={e=>setFullName(e.target.value)} required maxLength={120} autoComplete="name" className="mt-2 w-full border border-terminal-border bg-black px-3 py-3 text-[11px] text-white outline-none focus:border-terminal-amber/70" placeholder="Your name"/></label>}
            <label className="block text-[10px] text-gray-400">EMAIL ADDRESS<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required maxLength={254} autoComplete="email" className="mt-2 w-full border border-terminal-border bg-black px-3 py-3 text-[11px] text-white outline-none focus:border-terminal-amber/70" placeholder="you@example.com"/></label>
            <label className="block text-[10px] text-gray-400">PASSWORD<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required minLength={8} maxLength={128} autoComplete={mode==="signin"?"current-password":"new-password"} className="mt-2 w-full border border-terminal-border bg-black px-3 py-3 text-[11px] text-white outline-none focus:border-terminal-amber/70" placeholder="At least 8 characters"/></label>
            {error && <div role="alert" className="border border-terminal-bearish/40 bg-terminal-bearish/5 p-3 text-[10px] leading-relaxed text-red-300">{error}</div>}
            {notice && <div role="status" className="border border-terminal-bullish/30 bg-terminal-bullish/5 p-3 text-[10px] leading-relaxed text-green-300">{notice}</div>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 bg-terminal-amber py-3 text-[10px] font-bold tracking-widest text-black disabled:cursor-not-allowed disabled:opacity-60">{busy&&<LoaderCircle size={13} className="animate-spin"/>}{mode==="signin"?"SIGN IN TO STRATAFEED":"CREATE ACCOUNT"}</button>
          </form>
          <p className="mt-5 text-[9px] leading-relaxed text-gray-600">Authentication is handled by Supabase. Configure the public Supabase environment variables and email confirmation settings before production use.</p>
        </div>
      </div>
    </main>
  );
}
