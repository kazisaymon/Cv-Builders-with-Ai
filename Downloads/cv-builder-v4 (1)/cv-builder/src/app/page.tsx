"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import CVPreview from "@/components/CVPreview";
import Scaled from "@/components/Scaled";
import { CATEGORIES, PALETTE, TEMPLATES, getTemplate } from "@/lib/templates";
import { useCV } from "@/lib/store";
import type { Category } from "@/lib/types";

const PAGE = 12;
const HERO = ["modern-modern-2", "job-sidebar-1", "modern-executive-4"];

export default function Home() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [color, setColor] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const { cv, setTemplate, templateId } = useCV();
  const list = useMemo(() => TEMPLATES.filter((t) => (cat === "all" || t.category === cat) && (!color || t.color === color)), [cat, color]);
  const count = (id: Category | "all") => (id === "all" ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === id).length);

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm text-white">CV</span>
            CV Builder
          </span>
          <Link href="/editor" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90">Open editor</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[1fr_minmax(0,440px)] md:py-14">
        <div>
          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">Write your CV once. Wear it in {TEMPLATES.length} designs.</h1>
          <p className="mt-4 max-w-lg text-lg text-black/70">Type in Bangla, English or any language, switch templates in one click, change colours and fonts, and download a clean A4 PDF.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#templates" className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand/90">Choose a template</a>
            <Link href="/editor" className="rounded-lg border border-black/20 bg-white px-5 py-2.5 font-semibold hover:bg-black/[0.03]">Continue my CV</Link>
          </div>
          <p className="mt-4 text-sm text-black/60">Your CV is saved in your browser. You can download a backup from the editor.</p>
        </div>
        <div className="relative mx-auto hidden h-[400px] w-full max-w-[440px] md:block" aria-hidden>
          {HERO.map((id, i) => (
            <div
              key={id}
              className="absolute w-[230px] overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/10"
              style={{ left: i * 100, top: i === 1 ? 40 : i === 2 ? 14 : 0, zIndex: i === 1 ? 3 : 2 - (i === 2 ? 1 : 0), height: 325 }}
            >
              <Scaled><CVPreview cv={cv} t={getTemplate(id)} /></Scaled>
            </div>
          ))}
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="no-print flex gap-2 overflow-x-auto pb-2">
          {[{ id: "all", label: "All" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              onClick={() => { setCat(c.id as Category | "all"); setShown(PAGE); }}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium ${cat === c.id ? "border-ink bg-ink text-white" : "border-black/15 bg-white hover:bg-black/[0.03]"}`}
            >{c.label} <span className="opacity-60">{count(c.id as Category | "all")}</span></button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-black/60">Colour</span>
          <button onClick={() => { setColor(null); setShown(PAGE); }} className={`rounded-full border px-3 py-1 text-xs font-medium ${!color ? "border-ink bg-ink text-white" : "border-black/15 bg-white"}`}>Any</button>
          {PALETTE.map((col) => (
            <button
              key={col} aria-label={`Filter by colour ${col}`} onClick={() => { setColor(col); setShown(PAGE); }}
              className={`h-6 w-6 rounded-full border-2 ${color === col ? "border-ink" : "border-white ring-1 ring-black/15"}`} style={{ background: col }}
            />
          ))}
        </div>

        {list.length === 0 ? (
          <p className="mt-10 text-black/60">No templates match this colour in this category. Choose another colour or category.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.slice(0, shown).map((t) => (
              <Link
                key={t.id} href="/editor" onClick={() => setTemplate(t.id)}
                className={`group block overflow-hidden rounded-xl border bg-white p-2 hover:border-brand ${t.id === templateId ? "border-brand ring-2 ring-brand/30" : "border-black/10"}`}
              >
                <div className="pointer-events-none h-52 overflow-hidden"><Scaled><CVPreview cv={cv} t={t} /></Scaled></div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{t.name}</span>
                  <span className="shrink-0 text-xs font-semibold text-brand opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">Use</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {shown < list.length && (
          <button className="mx-auto mt-8 block rounded-lg border border-black/20 bg-white px-5 py-2 text-sm font-medium hover:bg-black/[0.03]" onClick={() => setShown((n) => n + PAGE)}>
            Show more ({list.length - shown} left)
          </button>
        )}
      </section>
    </div>
  );
}
