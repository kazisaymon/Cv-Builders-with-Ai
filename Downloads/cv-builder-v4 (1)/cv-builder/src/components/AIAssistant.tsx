"use client";
import { useEffect, useRef, useState } from "react";
import { useCV } from "@/lib/store";
import { newId } from "@/lib/sample";
import { parseReply, slimCV } from "@/lib/cvJson";
import type { CV } from "@/lib/types";

type Msg = { id: string; role: "user" | "ai"; text: string; file?: string; error?: boolean };

const START = [
  "Fresh CSE graduate applying for a junior software developer role. Skills: Python, SQL, React. Final-year project: a student result portal.",
  "Bank officer CV. BBA in Finance, 2 years in customer service at a private bank, good at Excel and report writing.",
  "আমি সদ্য পাস করা শিক্ষার্থী, ইংরেজি বিষয়ে অনার্স। স্কুলে শিক্ষকতার জন্য একটি সিভি বানাও।",
];
const FOLLOW = ["Make it more professional", "Add a projects section", "Make the summary shorter", "Translate to Bangla"];
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,.pdf,.docx,.txt,.md";
const MAX_MB = 4;

// Photos are shrunk in the browser so they stay under the upload limit.
async function prepare(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("That image could not be opened."));
      i.src = url;
    });
    const k = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } finally { URL.revokeObjectURL(url); }
}

export default function AIAssistant() {
  const { cv, importData } = useCV();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<CV[]>([]);
  const ta = useRef<HTMLTextAreaElement>(null);
  const pick = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    ta.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy, open]);

  const add = (m: Omit<Msg, "id">) => setMsgs((x) => [...x, { id: newId(), ...m }]);

  function choose(f: File | undefined) {
    if (!f) return;
    if (f.size > 15 * 1024 * 1024 || (!f.type.startsWith("image/") && f.size > MAX_MB * 1024 * 1024)) {
      add({ role: "ai", error: true, text: `That file is too large. PDF and Word files can be up to ${MAX_MB} MB.` });
      return;
    }
    setFile(f);
    ta.current?.focus();
  }

  async function send(preset?: string) {
    const text = (preset ?? input).trim();
    if (busy || (!file && text.length < 3)) return;
    const history = msgs.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    add({ role: "user", text: text || "Use this file for my CV.", file: file?.name });
    setInput("");
    const sending = file;
    setFile(null);
    setBusy(true);
    try {
      let r: Response;
      if (sending) {
        const ready = await prepare(sending);
        if (ready.size > MAX_MB * 1024 * 1024) throw new Error(`That file is too large. The limit is ${MAX_MB} MB.`);
        const fd = new FormData();
        fd.append("file", ready);
        fd.append("note", text);
        r = await fetch("/api/cv-import", { method: "POST", body: fd });
      } else {
        r = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: "chat", text, context: JSON.stringify(slimCV(cv)), history }),
        });
      }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || (r.status === 413 ? "That file is too large." : "AI request failed"));
      const out = parseReply(j.text, cv.photo);
      setUndo((u) => [...u.slice(-9), cv]);
      importData(out.cv);
      add({ role: "ai", text: out.message || (sending ? "I imported your CV. Check it in the preview." : "Done. Check the preview.") });
    } catch (e) {
      const m = e instanceof SyntaxError ? "The AI reply could not be read. Try again." : e instanceof Error ? e.message : "AI request failed";
      add({ role: "ai", error: true, text: m });
      if (sending) setFile(sending);
    } finally { setBusy(false); }
  }

  function undoLast() {
    const prev = undo[undo.length - 1];
    if (!prev) return;
    importData(prev);
    setUndo((u) => u.slice(0, -1));
    add({ role: "ai", text: "Undone. Your CV is back to the version before that change." });
  }

  const chip = "rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs hover:bg-black/5 disabled:opacity-50";
  return (
    <div className="no-print">
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 z-20 -translate-y-1/2 rounded-l-xl bg-ink px-2.5 py-4 text-sm font-semibold text-white shadow-lg hover:bg-ink/90 [writing-mode:vertical-rl]"
        aria-label="Open the AI CV assistant"
      >✦ AI CV</button>

      {open && (
        <div className="fixed inset-0 z-30" role="dialog" aria-modal="true" aria-label="AI CV assistant">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-black/10 p-4">
              <div>
                <h2 className="text-lg font-bold">AI CV assistant</h2>
                <p className="mt-0.5 text-xs text-black/60">Describe yourself, attach an old CV, or ask for changes. Every change shows in the preview.</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {undo.length > 0 && <button onClick={undoLast} disabled={busy} className="rounded-lg border border-black/15 px-2.5 py-1 text-sm disabled:opacity-50">Undo</button>}
                <button onClick={() => setOpen(false)} className="rounded-lg border border-black/15 px-2.5 py-1 text-sm" aria-label="Close">✕</button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {msgs.length === 0 && (
                <div className="grid gap-2">
                  <p className="text-sm text-black/75">Tell me your goal, education, jobs and skills in any language. Or attach your existing CV (photo, PDF or Word file) and I will turn it into an editable CV.</p>
                  <div className="text-xs font-medium text-black/60">Try an example</div>
                  {START.map((x) => (
                    <button key={x} onClick={() => setInput(x)} className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-left text-xs hover:bg-black/5">{x}</button>
                  ))}
                  <p className="rounded-lg bg-brand/5 p-3 text-xs text-black/70">
                    I do not invent facts. Anything you do not give me appears as a [placeholder], such as [Company name], for you to fill in. Check the result before you send your CV.
                  </p>
                </div>
              )}

              {msgs.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                    m.role === "user" ? "bg-ink text-white" : m.error ? "border border-red-200 bg-red-50 text-red-800" : "bg-black/5"
                  }`} role={m.error ? "alert" : undefined}>
                    {m.file && <div className="mb-1 text-xs opacity-75">📎 {m.file}</div>}
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && <div className="text-sm text-black/60">{file ? "Reading your CV…" : "Working on your CV…"}</div>}
              <div ref={end} />
            </div>

            <div className="border-t border-black/10 p-3">
              {msgs.length > 0 && !busy && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {FOLLOW.map((x) => <button key={x} className={chip} onClick={() => send(x)}>{x}</button>)}
                </div>
              )}
              {file && (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs">
                  <span className="truncate">📎 {file.name}</span>
                  <button onClick={() => setFile(null)} className="shrink-0 font-medium text-brand" aria-label="Remove file">Remove</button>
                </div>
              )}
              <textarea
                ref={ta} rows={3} maxLength={3000} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={file ? "Optional: what should I change? (for example translate it, or make it one page)" : "Describe yourself, or ask for a change…"}
                aria-label="Message"
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-brand"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <div>
                  <input ref={pick} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ""; }} />
                  <button onClick={() => pick.current?.click()} disabled={busy} className="rounded-lg border border-black/15 px-3 py-2 text-sm font-medium disabled:opacity-50">Attach CV</button>
                </div>
                <button onClick={() => send()} disabled={busy || (!file && input.trim().length < 3)} className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {busy ? "Working…" : file ? "Import" : "Send"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-black/50">Photo, PDF, Word or text file, up to {MAX_MB} MB. Your photo and template stay. Undo brings the previous version back.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
