export type Item = { id: string; heading: string; sub: string; date: string; bullets: string[] };
export type Field = { id: string; label: string; value: string }; // empty label + value = blank spacer row
export type Section = {
  id: string;
  title: string;
  kind: "text" | "items" | "fields" | "list";
  text: string; // used by "text" and "list" (one bullet per line)
  items: Item[];
  fields?: Field[];
};
export type CV = {
  name: string;
  headline: string;
  contact: string[];
  photo?: string; // data URL
  sections: Section[];
};

export type Layout = "classic" | "sidebar" | "banner" | "compact" | "minimal" | "bank" | "executive" | "timeline" | "modern" | "rightbar" | "ats";
export type Category = "europass" | "job" | "academic" | "scholarship" | "bank" | "modern" | "ats";
export type Template = {
  id: string;
  name: string;
  category: Category;
  layout: Layout;
  color: string;
  font: string;
};

export type Density = "tight" | "normal" | "airy";
// User overrides applied on top of the chosen template. null = use the template default.
export type Design = { accent: string | null; font: string | null; scale: number; density: Density };
export const DEFAULT_DESIGN: Design = { accent: null, font: null, scale: 1, density: "normal" };
