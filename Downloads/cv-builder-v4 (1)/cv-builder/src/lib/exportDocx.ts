import {
  AlignmentType, BorderStyle, Document, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TabStopType, TextRun, WidthType,
} from "docx";
import type { CV, Design, Section, Template } from "./types";
import { FONTS } from "./templates";

const TEXT_WIDTH = 9906; // A4 width minus margins, in twips
const lines = (t: string) => t.split("\n").map((l) => l.trim()).filter(Boolean);

// Word only has the fonts installed on the reader's computer, so map each web font to a safe look-alike.
function wordFont(design: Design, t: Template): string {
  const css = FONTS.find((f) => f.id === design.font)?.css ?? t.font;
  const first = css.split(",")[0].replace(/['"]/g, "").trim();
  const map: Record<string, string> = {
    Inter: "Calibri", Poppins: "Calibri", Arial: "Arial", Lora: "Georgia", Merriweather: "Georgia",
    "Source Serif 4": "Cambria", "Times New Roman": "Times New Roman", Times: "Times New Roman",
  };
  return map[first] ?? "Calibri";
}

export type DocxPhoto = { data: Uint8Array; type: "jpg" | "png"; width: number; height: number };

export async function buildDocx(cv: CV, t: Template, design: Design, photo?: DocxPhoto): Promise<Blob> {
  const base = wordFont(design, t);
  const accent = (design.accent ?? t.color).replace("#", "");
  const font = { ascii: base, hAnsi: base, cs: "Nirmala UI", eastAsia: "Microsoft YaHei" };
  const scale = design.scale || 1;
  const sz = (pt: number) => Math.round(pt * scale * 2); // half-points

  const run = (text: string, o: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}) =>
    new TextRun({
      text, font, bold: o.bold, italics: o.italics, color: o.color,
      size: sz(o.size ?? 10.5), sizeComplexScript: sz(o.size ?? 10.5), boldComplexScript: o.bold,
    });
  const rightTab = [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }];

  const head: Paragraph[] = [
    new Paragraph({ spacing: { after: 40 }, children: [run(cv.name, { bold: true, color: accent, size: 24 })] }),
  ];
  if (cv.headline) head.push(new Paragraph({ spacing: { after: 60 }, children: [run(cv.headline, { size: 12.5, color: "444444" })] }));
  if (cv.contact.length) head.push(new Paragraph({ spacing: { after: 120 }, children: [run(cv.contact.join("   |   "), { size: 9.5, color: "444444" })] }));

  const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
  const children: (Paragraph | Table)[] = [];

  if (photo) {
    children.push(
      new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH - 1900, 1900],
        borders: { ...noBorders, insideHorizontal: NB, insideVertical: NB },
        rows: [
          new TableRow({
            children: [
              new TableCell({ width: { size: TEXT_WIDTH - 1900, type: WidthType.DXA }, borders: noBorders, children: head }),
              new TableCell({
                width: { size: 1900, type: WidthType.DXA },
                borders: noBorders,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new ImageRun({ type: photo.type, data: photo.data, transformation: { width: photo.width, height: photo.height } })],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    children.push(...head);
  }

  const heading = (title: string) =>
    new Paragraph({
      keepNext: true,
      spacing: { before: 220, after: 90 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 } },
      children: [run(title, { bold: true, color: accent, size: 12 })],
    });
  const bullet = (text: string) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [run(text)] });

  function body(s: Section) {
    if (s.kind === "text") return lines(s.text).map((l) => new Paragraph({ spacing: { after: 60 }, children: [run(l)] }));
    if (s.kind === "list") return lines(s.text).map(bullet);
    if (s.kind === "fields")
      return (s.fields ?? []).map((f) =>
        !f.label && !f.value
          ? new Paragraph({ children: [run("")] })
          : new Paragraph({
              tabStops: [{ type: TabStopType.LEFT, position: 2600 }],
              spacing: { after: 20 },
              children: [run(f.label), new TextRun({ text: "\t" }), run(`: ${f.value}`)],
            })
      );
    return s.items.flatMap((it) => {
      const out: Paragraph[] = [
        new Paragraph({
          keepNext: true,
          tabStops: rightTab,
          spacing: { before: 60, after: 10 },
          children: [run(it.heading, { bold: true, size: 11 }), new TextRun({ text: "\t" }), run(it.date, { color: "555555", size: 10 })],
        }),
      ];
      if (it.sub) out.push(new Paragraph({ spacing: { after: 20 }, children: [run(it.sub, { italics: true, color: accent })] }));
      return out.concat(it.bullets.map(bullet));
    });
  }

  for (const s of cv.sections) {
    children.push(heading(s.title));
    children.push(...body(s));
  }

  const doc = new Document({
    creator: "CV Builder",
    title: cv.name,
    styles: { default: { document: { run: { font, size: sz(10.5) } } } },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 1000, right: 1000 } } },
        children,
      },
    ],
  });
  return Packer.toBlob(doc);
}

// Browser only: decode the stored data-URL photo and keep its aspect ratio within a 90 x 115 pt box.
export async function photoForDocx(dataUrl: string | undefined): Promise<DocxPhoto | undefined> {
  const m = dataUrl?.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/);
  if (!dataUrl || !m) return undefined;
  try {
    const bin = atob(m[2]);
    const data = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const dims = await new Promise<{ w: number; h: number }>((res, rej) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => rej(new Error("bad image"));
      img.src = dataUrl;
    });
    const k = Math.min(90 / dims.w, 115 / dims.h);
    return { data, type: m[1] === "png" ? "png" : "jpg", width: Math.round(dims.w * k), height: Math.round(dims.h * k) };
  } catch {
    return undefined;
  }
}
