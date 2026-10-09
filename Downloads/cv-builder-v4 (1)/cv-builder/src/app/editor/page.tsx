"use client";
import Link from "next/link";
import { useState } from "react";
import CVPreview from "@/components/CVPreview";
import AIAssistant from "@/components/AIAssistant";
import DownloadMenu from "@/components/DownloadMenu";
import EditorForm from "@/components/EditorForm";
import Scaled from "@/components/Scaled";
import { CATEGORIES, TEMPLATES, getTemplate } from "@/lib/templates";
import { useCV } from "@/lib/store";

export default function EditorPage() {
  const { cv, templateId, setTemplate, design } = useCV();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const t = getTemplate(templateId);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8">
      <AIAssistant />
      <div className="no-print sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-2 border-b border-black/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <Link href="/" className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium hover:bg-black/[0.03]">Templates</Link>
        <select
          value={t.id} onChange={(e) => setTemplate(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm" aria-label="Template"
        >
          {CATEGORIES.map((c) => (
            <optgroup key={c.id} label={c.label}>
              {TEMPLATES.filter((x) => x.category === c.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </optgroup>
          ))}
        </select>
        <DownloadMenu />
      </div>

      <div className="no-print mb-3 flex rounded-lg bg-black/5 p-1 lg:hidden">
        {(["edit", "preview"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-md py-1.5 text-sm font-medium ${tab === k ? "bg-white shadow-sm" : "text-black/60"}`}>
            {k === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,430px)_1fr]">
        <div className={`no-print ${tab === "edit" ? "" : "hidden"} lg:block`}><EditorForm /></div>
        <div className={`${tab === "preview" ? "" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-20"><Scaled><CVPreview cv={cv} t={t} design={design} /></Scaled></div>
        </div>
      </div>
    </div>
  );
}
