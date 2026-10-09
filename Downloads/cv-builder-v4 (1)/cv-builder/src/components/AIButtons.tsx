"use client";
import { useState } from "react";

const LANGS = ["English", "Bengali", "Chinese", "Arabic", "Hindi", "French", "German", "Spanish"];

export default function AIButtons({ text, onResult, summaryFrom }: { text: string; onResult: (t: string) => void; summaryFrom?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run(task: string, input: string, lang?: string) {
    if (!input.trim()) { setErr("Write something first."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, text: input, lang }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "AI request failed");
      onResult(j.text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI request failed");
    } finally { setBusy(false); }
  }

  const b = "rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-medium text-brand disabled:opacity-50";
  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <button className={b} disabled={busy} onClick={() => run("improve", text)}>Improve</button>
        <button className={b} disabled={busy} onClick={() => run("fix", text)}>Fix grammar</button>
        {summaryFrom !== undefined && <button className={b} disabled={busy} onClick={() => run("summary", summaryFrom)}>Write from CV</button>}
        <select className="rounded-lg border border-black/15 bg-white px-2 py-1.5 text-xs" defaultValue="" disabled={busy}
          onChange={(e) => { if (e.target.value) run("translate", text, e.target.value); e.target.value = ""; }} aria-label="Translate">
          <option value="" disabled>Translate to…</option>
          {LANGS.map((l) => <option key={l}>{l}</option>)}
        </select>
        {busy && <span className="text-xs text-black/60">Working…</span>}
      </div>
      {err && <p role="alert" className="text-xs text-red-700">{err}</p>}
    </div>
  );
}
