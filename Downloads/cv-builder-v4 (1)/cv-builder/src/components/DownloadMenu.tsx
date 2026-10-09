"use client";
import { useEffect, useRef, useState } from "react";
import CVPreview from "@/components/CVPreview";
import { getTemplate } from "@/lib/templates";
import { useCV } from "@/lib/store";
import { fileBase, pageToPng, saveBlob } from "@/lib/exportFiles";

type Kind = "pdf" | "png" | "docx";

export default function DownloadMenu() {
  const { cv, templateId, design } = useCV();
  const t = getTemplate(templateId);
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false); // the hidden export copy is only rendered after the menu was opened once
  const [busy, setBusy] = useState<Kind | null>(null);
  const [err, setErr] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const shot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("keydown", esc); };
  }, [open]);

  async function run(kind: Kind) {
    setOpen(false);
    setErr("");
    if (kind === "pdf") { window.print(); return; }
    setBusy(kind);
    try {
      if (kind === "png") {
        const node = shot.current?.querySelector<HTMLElement>(".cv-page");
        if (!node) throw new Error("The page is not ready yet. Try again.");
        saveBlob(await pageToPng(node), `${fileBase(cv.name)}.png`);
      } else {
        const { buildDocx, photoForDocx } = await import("@/lib/exportDocx");
        saveBlob(await buildDocx(cv, t, design, await photoForDocx(cv.photo)), `${fileBase(cv.name)}.docx`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Download failed. Try again.");
    } finally { setBusy(null); }
  }

  const item = "flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-black/5 disabled:opacity-50";
  return (
    <div ref={root} className="relative">
      <button
        onClick={() => { setArmed(true); setOpen((o) => !o); }}
        disabled={!!busy}
        aria-haspopup="menu" aria-expanded={open}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
      >{busy ? "Preparing…" : "Download ▾"}</button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-black/10 bg-white p-1.5 shadow-xl">
          <button role="menuitem" className={item} onClick={() => run("pdf")}>
            <span className="text-sm font-medium">PDF</span>
            <span className="text-xs text-black/55">Opens print. Choose &ldquo;Save as PDF&rdquo;. Text stays selectable.</span>
          </button>
          <button role="menuitem" className={item} onClick={() => run("png")}>
            <span className="text-sm font-medium">Image (PNG)</span>
            <span className="text-xs text-black/55">Looks exactly like the preview.</span>
          </button>
          <button role="menuitem" className={item} onClick={() => run("docx")}>
            <span className="text-sm font-medium">Word (.docx)</span>
            <span className="text-xs text-black/55">Editable. Simplified layout, same colour and sections.</span>
          </button>
        </div>
      )}

      {err && <p role="alert" className="absolute right-0 top-full z-30 mt-2 w-60 rounded-lg border border-red-200 bg-white p-2 text-xs text-red-700 shadow-lg">{err}</p>}

      {armed && (
        <div ref={shot} aria-hidden="true" className="no-print" style={{ position: "fixed", left: -10000, top: 0, width: 794, pointerEvents: "none" }}>
          <CVPreview cv={cv} t={t} design={design} />
        </div>
      )}
    </div>
  );
}
