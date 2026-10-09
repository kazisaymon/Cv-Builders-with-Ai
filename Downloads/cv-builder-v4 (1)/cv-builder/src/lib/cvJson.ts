import type { CV, Section } from "./types";
import { newId } from "./sample";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strs = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

// The model's JSON is untrusted input: keep only the fields we know and force the types we expect.
export function toCV(raw: unknown, photo: string | undefined): CV {
  const o = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(o.sections) ? o.sections : [];
  const sections: Section[] = list.slice(0, 14).map((x) => {
    const r = (x ?? {}) as Record<string, unknown>;
    const items = Array.isArray(r.items) ? r.items : [];
    const fields = Array.isArray(r.fields) ? r.fields : [];
    let kind: Section["kind"] =
      r.kind === "list" || r.kind === "items" || r.kind === "fields" || r.kind === "text" ? r.kind : items.length ? "items" : "text";
    if (kind === "items" && !items.length) kind = "text";
    if (kind === "fields" && !fields.length) kind = "text";
    const text = Array.isArray(r.text) ? strs(r.text).join("\n") : str(r.text);
    return {
      id: newId(),
      title: str(r.title) || "Section",
      kind,
      text,
      fields: fields.slice(0, 30).map((f) => {
        const i = (f ?? {}) as Record<string, unknown>;
        return { id: newId(), label: str(i.label), value: str(i.value) };
      }),
      items: items.slice(0, 14).map((it) => {
        const i = (it ?? {}) as Record<string, unknown>;
        return { id: newId(), heading: str(i.heading), sub: str(i.sub), date: str(i.date), bullets: strs(i.bullets).slice(0, 10) };
      }),
    };
  });
  if (!sections.length) throw new Error("The AI returned no sections. Try again.");
  return { name: str(o.name) || "YOUR NAME", headline: str(o.headline), contact: strs(o.contact).slice(0, 8), photo, sections };
}

export function parseJson(text: string): unknown {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("The AI reply was not a CV. Try again.");
  return JSON.parse(text.slice(a, b + 1));
}

// Replies look like { message, cv }. A bare CV object is accepted too.
export function parseReply(text: string, photo: string | undefined): { message: string; cv: CV } {
  const o = parseJson(text) as Record<string, unknown>;
  const hasCv = o && typeof o.cv === "object" && o.cv !== null;
  return { message: hasCv ? str(o.message) : "", cv: toCV(hasCv ? o.cv : o, photo) };
}

// Compact copy of the CV for the model: no ids and no photo.
export function slimCV(cv: CV) {
  return {
    name: cv.name,
    headline: cv.headline,
    contact: cv.contact,
    sections: cv.sections.map((s) => ({
      title: s.title,
      kind: s.kind,
      ...(s.kind === "text" || s.kind === "list" ? { text: s.text } : {}),
      ...(s.kind === "items" ? { items: s.items.map(({ heading, sub, date, bullets }) => ({ heading, sub, date, bullets })) } : {}),
      ...(s.kind === "fields" ? { fields: (s.fields ?? []).map(({ label, value }) => ({ label, value })) } : {}),
    })),
  };
}
