"use client";
import { useRef, useState } from "react";
import { useCV } from "@/lib/store";
import { FONTS, PALETTE, getTemplate } from "@/lib/templates";
import type { CV, Density, Design } from "@/lib/types";
import AIButtons from "./AIButtons";

const input = "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-brand";
const btn = "rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium hover:bg-black/[0.03] active:bg-black/5 disabled:opacity-40";
const card = "grid gap-3 rounded-2xl border border-black/10 bg-white p-4";

function resizeToDataUrl(file: File, max = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });
}

function DesignPanel() {
  const { design, setDesign, resetDesign, templateId } = useCV();
  const t = getTemplate(templateId);
  const current = design.accent ?? t.color;
  const sizes: [string, number][] = [["Small", 0.92], ["Normal", 1], ["Large", 1.08]];
  const spacing: [string, Density][] = [["Tight", "tight"], ["Normal", "normal"], ["Airy", "airy"]];
  const seg = (on: boolean) => `flex-1 rounded-md py-1.5 text-sm font-medium ${on ? "bg-white shadow-sm" : "text-black/60"}`;
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Design</h2>
        <button className="text-xs text-black/60 underline" onClick={resetDesign}>Reset to template</button>
      </div>
      <div>
        <div className="mb-1.5 text-xs font-medium text-black/60">Colour</div>
        <div className="flex flex-wrap items-center gap-2">
          {PALETTE.map((col) => (
            <button
              key={col} aria-label={`Use colour ${col}`} onClick={() => setDesign({ accent: col })}
              className={`h-7 w-7 rounded-full border-2 ${current.toLowerCase() === col ? "border-ink" : "border-white ring-1 ring-black/15"}`}
              style={{ background: col }}
            />
          ))}
          <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs text-black/60">
            <input type="color" value={current} onChange={(e) => setDesign({ accent: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-black/15 bg-white p-0.5" />
            Custom
          </label>
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-xs font-medium text-black/60">Font</div>
        <select className={input} value={design.font ?? ""} onChange={(e) => setDesign({ font: e.target.value || null })} aria-label="Font">
          <option value="">Template default</option>
          {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1.5 text-xs font-medium text-black/60">Text size</div>
          <div className="flex rounded-lg bg-black/5 p-1">
            {sizes.map(([l, v]) => <button key={l} className={seg(design.scale === v)} onClick={() => setDesign({ scale: v })}>{l}</button>)}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium text-black/60">Spacing</div>
          <div className="flex rounded-lg bg-black/5 p-1">
            {spacing.map(([l, v]) => <button key={l} className={seg(design.density === v)} onClick={() => setDesign({ density: v })}>{l}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Backup() {
  const { cv, templateId, design, importData } = useCV();
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: "cv-builder", cv, templateId, design }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(cv.name || "cv").trim().replace(/\s+/g, "-").toLowerCase()}-cv.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      const next = data.cv as CV;
      if (!next || !Array.isArray(next.sections)) throw new Error();
      importData(next, data.templateId, data.design as Design | undefined);
      setMsg("Backup loaded.");
    } catch {
      setMsg("That file is not a CV Builder backup.");
    }
  };
  return (
    <div className={card}>
      <h2 className="font-semibold">Backup</h2>
      <p className="text-xs text-black/60">Your CV is saved in this browser only. Download a backup to keep it safe or move it to another device.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn} onClick={exportJson}>Download backup</button>
        <button className={btn} onClick={() => ref.current?.click()}>Load backup</button>
        <input ref={ref} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
      </div>
      {msg && <p role="status" className="text-xs text-black/70">{msg}</p>}
    </div>
  );
}

export default function EditorForm() {
  const s = useCV();
  const { cv } = s;
  const fileRef = useRef<HTMLInputElement>(null);
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-4 pb-24">
      <DesignPanel />
      <div className="grid gap-2 rounded-2xl border border-black/10 bg-white p-4">
        <h2 className="font-semibold">Basics</h2>
        <input className={input} value={cv.name} onChange={(e) => s.setField("name", e.target.value)} placeholder="Full name" />
        <input className={input} value={cv.headline} onChange={(e) => s.setField("headline", e.target.value)} placeholder="Headline (optional)" />
        <textarea className={input} rows={3} value={cv.contact.join("\n")} onChange={(e) => s.setContact(e.target.value.split("\n"))} placeholder="One contact detail per line" />
        <div className="flex items-center gap-3">
          {cv.photo && <img src={cv.photo} alt="Your photo" className="h-14 w-12 rounded object-cover" />}
          <input
            ref={fileRef} type="file" accept="image/*" hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) s.setPhoto(await resizeToDataUrl(f));
              e.target.value = "";
            }}
          />
          <button className={btn} onClick={() => fileRef.current?.click()}>{cv.photo ? "Change photo" : "Add photo"}</button>
          {cv.photo && <button className={btn} onClick={() => s.setPhoto(undefined)}>Remove</button>}
        </div>
      </div>

      {cv.sections.map((sec, idx) => (
        <div key={sec.id} className={card}>
          <div className="flex items-center gap-2">
            <input className={`${input} font-semibold`} value={sec.title} onChange={(e) => s.updateSection(sec.id, { title: e.target.value })} aria-label="Section title" />
            <button className={btn} onClick={() => setClosed((c) => ({ ...c, [sec.id]: !c[sec.id] }))} aria-expanded={!closed[sec.id]} aria-label={closed[sec.id] ? "Expand section" : "Collapse section"}>{closed[sec.id] ? "▸" : "▾"}</button>
            <button className={btn} onClick={() => s.moveSection(sec.id, -1)} disabled={idx === 0} aria-label="Move up">↑</button>
            <button className={btn} onClick={() => s.moveSection(sec.id, 1)} disabled={idx === cv.sections.length - 1} aria-label="Move down">↓</button>
            <button className={btn} onClick={() => s.removeSection(sec.id)} aria-label="Delete section">✕</button>
          </div>

          {!closed[sec.id] && (sec.kind === "text" || sec.kind === "list") && (
            <>
              <textarea
                className={input} rows={5} value={sec.text}
                placeholder={sec.kind === "list" ? "One point per line" : ""}
                onChange={(e) => s.updateSection(sec.id, { text: e.target.value })}
              />
              <AIButtons
                text={sec.text} onResult={(t) => s.updateSection(sec.id, { text: t })}
                summaryFrom={sec.kind === "text" ? JSON.stringify({ headline: cv.headline, sections: cv.sections.filter((x) => x.id !== sec.id).map((x) => ({ title: x.title, text: x.text, items: x.items, fields: x.fields })) }) : undefined}
              />
            </>
          )}

          {!closed[sec.id] && sec.kind === "fields" && (
            <>
              <p className="text-xs text-black/60">Each row shows as “Label : value”. Leave both empty for a blank gap.</p>
              {(sec.fields ?? []).map((f) => (
                <div key={f.id} className="flex gap-2">
                  <input className={input} placeholder="Label" value={f.label} onChange={(e) => s.updateField(sec.id, f.id, { label: e.target.value })} />
                  <input className={input} placeholder="Value" value={f.value} onChange={(e) => s.updateField(sec.id, f.id, { value: e.target.value })} />
                  <button className={btn} onClick={() => s.removeField(sec.id, f.id)} aria-label="Remove row">✕</button>
                </div>
              ))}
              <button className={btn} onClick={() => s.addField(sec.id)}>Add row</button>
            </>
          )}

          {!closed[sec.id] && sec.kind === "items" && (
            <>
              {sec.items.map((it) => (
                <div key={it.id} className="grid gap-2 rounded-xl border border-black/10 p-3">
                  <input className={input} placeholder="Title" value={it.heading} onChange={(e) => s.updateItem(sec.id, it.id, { heading: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={input} placeholder="Organisation" value={it.sub} onChange={(e) => s.updateItem(sec.id, it.id, { sub: e.target.value })} />
                    <input className={input} placeholder="Date" value={it.date} onChange={(e) => s.updateItem(sec.id, it.id, { date: e.target.value })} />
                  </div>
                  <textarea
                    className={input} rows={3} placeholder="One bullet per line" value={it.bullets.join("\n")}
                    onChange={(e) => s.updateItem(sec.id, it.id, { bullets: e.target.value.split("\n") })}
                  />
                  <AIButtons text={it.bullets.join("\n")} onResult={(t) => s.updateItem(sec.id, it.id, { bullets: t.split("\n").map((l) => l.replace(/^[-•*]\s*/, "")) })} />
                  <button className={`${btn} justify-self-end text-red-700`} onClick={() => s.removeItem(sec.id, it.id)}>Remove entry</button>
                </div>
              ))}
              <button className={btn} onClick={() => s.addItem(sec.id)}>Add entry</button>
            </>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => s.addSection("items")}>Add entries section</button>
        <button className={btn} onClick={() => s.addSection("fields")}>Add details section</button>
        <button className={btn} onClick={() => s.addSection("list")}>Add bullet list</button>
        <button className={btn} onClick={() => s.addSection("text")}>Add text section</button>
      </div>
      <Backup />
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => confirm("Replace your CV with the bank CV layout?") && s.loadBank()}>Load bank CV sample</button>
        <button className={`${btn} text-red-700`} onClick={() => confirm("Replace your CV with the sample?") && s.reset()}>Reset to sample</button>
      </div>
    </div>
  );
}
