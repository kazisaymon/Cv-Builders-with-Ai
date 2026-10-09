import type { Category, Layout, Template } from "./types";

export const CATEGORIES: { id: Category; label: string; font: string; layouts: Layout[]; colors: number }[] = [
  { id: "modern", label: "Modern", font: "Poppins, 'Noto Sans Bengali', sans-serif", layouts: ["modern", "rightbar", "timeline", "executive"], colors: 8 },
  { id: "ats", label: "ATS-friendly", font: "Arial, Helvetica, 'Noto Sans Bengali', sans-serif", layouts: ["ats", "executive"], colors: 4 },
  { id: "europass", label: "Europass", font: "Inter", layouts: ["classic", "sidebar", "banner", "compact", "minimal"], colors: 8 },
  { id: "job", label: "Job CV", font: "Inter", layouts: ["classic", "sidebar", "banner", "compact", "minimal"], colors: 8 },
  { id: "academic", label: "Academic CV", font: "'Source Serif 4', 'Noto Sans Bengali', serif", layouts: ["classic", "sidebar", "banner", "compact", "minimal"], colors: 8 },
  { id: "scholarship", label: "Scholarship CV", font: "Merriweather, 'Noto Sans Bengali', serif", layouts: ["classic", "sidebar", "banner", "compact", "minimal"], colors: 8 },
  { id: "bank", label: "Bank CV", font: "'Times New Roman', Times, 'Noto Sans Bengali', serif", layouts: ["bank"], colors: 8 },
];

// First six colours keep their original order so template ids saved in people's browsers stay valid.
export const PALETTE = ["#1d4e89", "#0f766e", "#7c2d12", "#4c1d95", "#111827", "#be123c", "#0369a1", "#15803d"];
const ATS_COLORS = ["#111827", "#1d4e89", "#0f766e", "#7c2d12"];

export const FONTS = [
  { id: "Inter", label: "Inter (clean sans)", css: "Inter" },
  { id: "Poppins", label: "Poppins (rounded sans)", css: "Poppins" },
  { id: "Arial", label: "Arial (ATS safe)", css: "Arial, Helvetica" },
  { id: "Lora", label: "Lora (soft serif)", css: "Lora, serif" },
  { id: "Source Serif 4", label: "Source Serif (academic)", css: "'Source Serif 4', serif" },
  { id: "Merriweather", label: "Merriweather (sturdy serif)", css: "Merriweather, serif" },
  { id: "Times", label: "Times New Roman (formal)", css: "'Times New Roman', Times, serif" },
];

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const TEMPLATES: Template[] = CATEGORIES.flatMap((c) =>
  c.layouts.flatMap((layout) =>
    (c.id === "ats" ? ATS_COLORS : PALETTE).slice(0, c.colors).map((color, i) => ({
      id: `${c.id}-${layout}-${i + 1}`,
      name: c.label.toLowerCase().startsWith(layout) ? `${c.label} ${i + 1}` : `${c.label} ${cap(layout)} ${i + 1}`,
      category: c.id,
      layout,
      color,
      font: c.font,
    }))
  )
);

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES.find((t) => t.id === "job-classic-1") ?? TEMPLATES[0];
