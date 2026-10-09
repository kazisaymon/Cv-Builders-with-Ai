"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CV, Design, Field, Item, Section } from "./types";
import { DEFAULT_DESIGN } from "./types";
import { BANK_CV, SAMPLE_CV, newId } from "./sample";

type State = {
  cv: CV;
  templateId: string;
  design: Design;
  setDesign: (patch: Partial<Design>) => void;
  resetDesign: () => void;
  importData: (cv: CV, templateId?: string, design?: Design) => void;
  setTemplate: (id: string) => void;
  setField: (k: "name" | "headline", v: string) => void;
  setContact: (lines: string[]) => void;
  updateSection: (sid: string, patch: Partial<Section>) => void;
  addSection: (kind: Section["kind"]) => void;
  removeSection: (sid: string) => void;
  moveSection: (sid: string, dir: -1 | 1) => void;
  addItem: (sid: string) => void;
  updateItem: (sid: string, iid: string, patch: Partial<Item>) => void;
  removeItem: (sid: string, iid: string) => void;
  setPhoto: (photo: string | undefined) => void;
  addField: (sid: string) => void;
  updateField: (sid: string, fid: string, patch: Partial<Field>) => void;
  removeField: (sid: string, fid: string) => void;
  loadBank: () => void;
  reset: () => void;
};

export const useCV = create<State>()(
  persist(
    (set) => ({
      cv: SAMPLE_CV,
      templateId: "job-classic-1",
      design: DEFAULT_DESIGN,
      setDesign: (patch) => set((s) => ({ design: { ...s.design, ...patch } })),
      resetDesign: () => set({ design: DEFAULT_DESIGN }),
      importData: (cv, templateId, design) => set((s) => ({ cv, templateId: templateId ?? s.templateId, design: design ?? s.design })),
      setTemplate: (templateId) => set({ templateId }),
      setField: (k, v) => set((s) => ({ cv: { ...s.cv, [k]: v } })),
      setContact: (contact) => set((s) => ({ cv: { ...s.cv, contact } })),
      updateSection: (sid, patch) =>
        set((s) => ({ cv: { ...s.cv, sections: s.cv.sections.map((x) => (x.id === sid ? { ...x, ...patch } : x)) } })),
      addSection: (kind) =>
        set((s) => ({
          cv: { ...s.cv, sections: [...s.cv.sections, { id: newId(), title: "New section", kind, text: "", items: [], fields: [] }] },
        })),
      removeSection: (sid) => set((s) => ({ cv: { ...s.cv, sections: s.cv.sections.filter((x) => x.id !== sid) } })),
      moveSection: (sid, dir) =>
        set((s) => {
          const a = [...s.cv.sections];
          const i = a.findIndex((x) => x.id === sid);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= a.length) return s;
          [a[i], a[j]] = [a[j], a[i]];
          return { cv: { ...s.cv, sections: a } };
        }),
      addItem: (sid) =>
        set((s) => ({
          cv: {
            ...s.cv,
            sections: s.cv.sections.map((x) =>
              x.id === sid ? { ...x, items: [...x.items, { id: newId(), heading: "", sub: "", date: "", bullets: [] }] } : x
            ),
          },
        })),
      updateItem: (sid, iid, patch) =>
        set((s) => ({
          cv: {
            ...s.cv,
            sections: s.cv.sections.map((x) =>
              x.id === sid ? { ...x, items: x.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) } : x
            ),
          },
        })),
      removeItem: (sid, iid) =>
        set((s) => ({
          cv: { ...s.cv, sections: s.cv.sections.map((x) => (x.id === sid ? { ...x, items: x.items.filter((it) => it.id !== iid) } : x)) },
        })),
      setPhoto: (photo) => set((s) => ({ cv: { ...s.cv, photo } })),
      addField: (sid) =>
        set((s) => ({
          cv: { ...s.cv, sections: s.cv.sections.map((x) => (x.id === sid ? { ...x, fields: [...(x.fields ?? []), { id: newId(), label: "", value: "" }] } : x)) },
        })),
      updateField: (sid, fid, patch) =>
        set((s) => ({
          cv: { ...s.cv, sections: s.cv.sections.map((x) => (x.id === sid ? { ...x, fields: (x.fields ?? []).map((f) => (f.id === fid ? { ...f, ...patch } : f)) } : x)) },
        })),
      removeField: (sid, fid) =>
        set((s) => ({
          cv: { ...s.cv, sections: s.cv.sections.map((x) => (x.id === sid ? { ...x, fields: (x.fields ?? []).filter((f) => f.id !== fid) } : x)) },
        })),
      loadBank: () => set((s) => ({ cv: { ...BANK_CV, photo: s.cv.photo }, templateId: s.templateId.startsWith("bank") ? s.templateId : "bank-bank-1" })),
      reset: () => set({ cv: SAMPLE_CV }),
    }),
    {
      name: "cv-builder-state",
      // Bump this when the sample data changes: older saved CVs are replaced once with the new sample.
      version: 2,
      migrate: (persisted) => ({ ...(persisted as State), cv: SAMPLE_CV }),
    }
  )
);
