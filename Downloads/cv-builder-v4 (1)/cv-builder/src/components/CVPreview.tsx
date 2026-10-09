"use client";
import type { CSSProperties, ReactNode } from "react";
import type { CV, Design, Section, Template } from "@/lib/types";
import { DEFAULT_DESIGN } from "@/lib/types";
import { FONTS } from "@/lib/templates";

const lines = (t: string) => t.split("\n").map((l) => l.trim()).filter(Boolean);
type Ctx = { color: string; fs: number; lh: number };
const px = (n: number, c: Ctx) => +(n * c.fs).toFixed(2);

function Body({ s, c, timeline }: { s: Section; c: Ctx; timeline?: boolean }) {
  const base: CSSProperties = { fontSize: px(12.5, c), lineHeight: c.lh };
  if (s.kind === "text") return <p style={{ ...base, whiteSpace: "pre-wrap", margin: 0 }}>{s.text}</p>;
  if (s.kind === "list")
    return (
      <ul style={{ ...base, margin: 0, paddingLeft: 20 }}>
        {lines(s.text).map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    );
  if (s.kind === "fields")
    return (
      <div style={{ ...base, lineHeight: c.lh + 0.1 }}>
        {(s.fields ?? []).map((f) =>
          !f.label && !f.value ? (
            <div key={f.id} style={{ height: 12 }} />
          ) : (
            <div key={f.id} style={{ display: "grid", gridTemplateColumns: "170px 1fr" }}>
              <span>{f.label}</span>
              <span>: {f.value}</span>
            </div>
          )
        )}
      </div>
    );

  const bullets = (b: string[]) =>
    b.length > 0 && (
      <ul style={{ margin: "3px 0 0", paddingLeft: 18, fontSize: px(12.5, c), lineHeight: c.lh - 0.05 }}>
        {b.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    );

  return (
    <div style={{ display: "grid", gap: timeline ? 12 : 9 }}>
      {s.items.map((it) =>
        timeline ? (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 14, breakInside: "avoid" }}>
            <div style={{ textAlign: "right", fontSize: px(11.5, c), color: "#555", paddingTop: 1 }}>{it.date}</div>
            <div style={{ borderLeft: `2px solid ${c.color}55`, paddingLeft: 14, position: "relative" }}>
              <span style={{ position: "absolute", left: -6, top: 4, width: 10, height: 10, borderRadius: "50%", background: c.color }} />
              <strong style={{ fontSize: px(13, c) }}>{it.heading}</strong>
              {it.sub && <div style={{ fontSize: px(12, c), color: c.color }}>{it.sub}</div>}
              {bullets(it.bullets)}
            </div>
          </div>
        ) : (
          <div key={it.id} style={{ breakInside: "avoid" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: px(13, c) }}>
              <strong>{it.heading}</strong>
              <span style={{ color: "#555", fontSize: px(12, c), whiteSpace: "nowrap" }}>{it.date}</span>
            </div>
            {it.sub && <div style={{ fontSize: px(12, c), color: c.color, fontStyle: "italic" }}>{it.sub}</div>}
            {bullets(it.bullets)}
          </div>
        )
      )}
    </div>
  );
}

function Heading({ children, c, layout }: { children: ReactNode; c: Ctx; layout: Template["layout"] }) {
  const base: CSSProperties = { margin: "0 0 6px", color: c.color, fontSize: px(13.5, c), fontWeight: 700, breakAfter: "avoid" };
  switch (layout) {
    case "minimal":
      return <h2 style={{ ...base, fontWeight: 600, letterSpacing: 0.3 }}>{children}</h2>;
    case "bank":
      return <h2 style={{ ...base, color: "#000", fontSize: px(13, c), fontWeight: 400, background: "#d9d9d9", border: "1px solid #333", padding: "3px 8px" }}>{children}</h2>;
    case "modern":
      return <h2 style={{ ...base, fontSize: px(14, c), borderLeft: `4px solid ${c.color}`, paddingLeft: 9 }}>{children}</h2>;
    case "executive":
      return <h2 style={{ ...base, fontSize: px(12.5, c), textTransform: "uppercase", letterSpacing: 1.6, borderBottom: `1px solid ${c.color}`, paddingBottom: 3 }}>{children}</h2>;
    case "ats":
      return <h2 style={{ ...base, color: "#000", fontSize: px(12.5, c), textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: 2 }}>{children}</h2>;
    case "timeline":
      return <h2 style={{ ...base, fontSize: px(14, c), color: c.color }}>{children}</h2>;
    default:
      return <h2 style={{ ...base, borderBottom: `1.5px solid ${c.color}`, paddingBottom: 3 }}>{children}</h2>;
  }
}

const photoStyle = (w: number, h: number, radius: number | string = 0): CSSProperties => ({ width: w, height: h, objectFit: "cover", borderRadius: radius, display: "block" });
const GAPS = { tight: 0.72, normal: 1, airy: 1.3 } as const;
const LH = { tight: 1.36, normal: 1.5, airy: 1.66 } as const;
// Sections that belong in a narrow side column (skills, languages, short detail lists).
const isSideSection = (s: Section) => s.kind === "list" || s.kind === "fields" || /skill|language|tool|interest|certif/i.test(s.title);

export default function CVPreview({ cv, t, design = DEFAULT_DESIGN }: { cv: CV; t: Template; design?: Design }) {
  const color = design.accent ?? t.color;
  const fontCss = FONTS.find((f) => f.id === design.font)?.css ?? t.font;
  const c: Ctx = { color, fs: design.scale, lh: LH[design.density] };
  const gap = Math.round((t.layout === "compact" ? 10 : t.layout === "bank" ? 18 : 16) * GAPS[design.density]);
  const wrap: CSSProperties = { fontFamily: `${fontCss}, 'Noto Sans Bengali', 'Noto Sans SC', sans-serif` };
  const contactLines = cv.contact.filter(Boolean);
  const contact = <div style={{ fontSize: px(12, c), opacity: 0.85 }}>{contactLines.join("  |  ")}</div>;
  const renderSec = (s: Section, timeline = false) => (
    <section key={s.id} style={{ marginBottom: gap }}>
      <Heading c={c} layout={t.layout}>{s.title}</Heading>
      <Body s={s} c={c} timeline={timeline} />
    </section>
  );
  const secs = cv.sections.map((s) => renderSec(s));

  if (t.layout === "bank")
    return (
      <div className="cv-page" style={{ ...wrap, padding: "48px 56px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: px(21, c), fontWeight: 400, margin: "0 0 4px", textDecoration: "underline", color }}>{cv.name}</h1>
            {cv.headline && <div style={{ fontSize: px(13, c), marginBottom: 2 }}>{cv.headline}</div>}
            {contactLines.map((x, i) => <div key={i} style={{ fontSize: px(13, c), lineHeight: 1.45 }}>{x}</div>)}
          </div>
          {cv.photo && <img src={cv.photo} alt="" style={photoStyle(125, 150)} />}
        </header>
        {secs}
      </div>
    );

  if (t.layout === "sidebar") {
    const side = cv.sections.slice(0, 1);
    const main = cv.sections.slice(1);
    return (
      <div className="cv-page" style={{ ...wrap, display: "grid", gridTemplateColumns: "240px 1fr" }}>
        <aside style={{ background: color, color: "#fff", padding: 24 }}>
          {cv.photo && <div style={{ marginBottom: 14 }}><img src={cv.photo} alt="" style={photoStyle(96, 96, "50%")} /></div>}
          <h1 style={{ fontSize: px(22, c), margin: 0, lineHeight: 1.2 }}>{cv.name}</h1>
          <p style={{ fontSize: px(12.5, c), opacity: 0.9 }}>{cv.headline}</p>
          <div style={{ display: "grid", gap: 4, fontSize: px(12, c), margin: "14px 0" }}>{contactLines.map((x, i) => <span key={i}>{x}</span>)}</div>
          {side.map((s) => (
            <section key={s.id}><h2 style={{ fontSize: px(13.5, c), borderBottom: "1px solid #fff8", paddingBottom: 3 }}>{s.title}</h2><Body s={s} c={{ ...c, color: "#fff" }} /></section>
          ))}
        </aside>
        <main style={{ padding: 28 }}>{main.map((s) => renderSec(s))}</main>
      </div>
    );
  }

  if (t.layout === "rightbar") {
    const side = cv.sections.filter(isSideSection);
    const main = cv.sections.filter((s) => !isSideSection(s));
    return (
      <div className="cv-page" style={{ ...wrap, display: "grid", gridTemplateColumns: "1fr 236px" }}>
        <main style={{ padding: "36px 28px 36px 40px" }}>
          <h1 style={{ fontSize: px(29, c), margin: 0, color, lineHeight: 1.15, fontWeight: 700 }}>{cv.name}</h1>
          <p style={{ margin: "6px 0 22px", fontSize: px(13.5, c), fontWeight: 600 }}>{cv.headline}</p>
          {main.map((s) => renderSec(s))}
        </main>
        <aside style={{ background: `${color}14`, padding: "36px 22px", borderLeft: `3px solid ${color}` }}>
          {cv.photo && <div style={{ marginBottom: 16 }}><img src={cv.photo} alt="" style={photoStyle(110, 130, 10)} /></div>}
          <div style={{ display: "grid", gap: 5, fontSize: px(12, c), marginBottom: 20, wordBreak: "break-word" }}>{contactLines.map((x, i) => <span key={i}>{x}</span>)}</div>
          {side.map((s) => renderSec(s))}
        </aside>
      </div>
    );
  }

  if (t.layout === "modern")
    return (
      <div className="cv-page" style={wrap}>
        <div style={{ height: 8, background: color }} />
        <header style={{ padding: "30px 40px 0", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: px(31, c), margin: 0, fontWeight: 700, lineHeight: 1.1 }}>{cv.name}</h1>
            <p style={{ margin: "6px 0 10px", fontSize: px(14, c), fontWeight: 600, color }}>{cv.headline}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", fontSize: px(12, c), color: "#444" }}>{contactLines.map((x, i) => <span key={i}>{x}</span>)}</div>
          </div>
          {cv.photo && <img src={cv.photo} alt="" style={photoStyle(98, 98, 16)} />}
        </header>
        <main style={{ padding: "22px 40px 36px" }}>{secs}</main>
      </div>
    );

  if (t.layout === "executive")
    return (
      <div className="cv-page" style={{ ...wrap, padding: "40px 46px" }}>
        <header style={{ textAlign: "center", paddingBottom: 14, marginBottom: 18, borderBottom: `1px solid ${color}`, boxShadow: `0 4px 0 -3px #fff, 0 5px 0 -3px ${color}` }}>
          {cv.photo && <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><img src={cv.photo} alt="" style={photoStyle(84, 84, "50%")} /></div>}
          <h1 style={{ fontSize: px(27, c), margin: 0, letterSpacing: 3, textTransform: "uppercase", color, fontWeight: 700 }}>{cv.name}</h1>
          {cv.headline && <p style={{ margin: "6px 0 6px", fontSize: px(13, c), fontStyle: "italic" }}>{cv.headline}</p>}
          {contact}
        </header>
        {secs}
      </div>
    );

  if (t.layout === "ats")
    return (
      <div className="cv-page" style={{ ...wrap, padding: "38px 44px", color: "#000" }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: px(24, c), margin: 0, fontWeight: 700 }}>{cv.name}</h1>
          {cv.headline && <div style={{ fontSize: px(13, c), margin: "3px 0" }}>{cv.headline}</div>}
          {contact}
        </header>
        {secs}
      </div>
    );

  if (t.layout === "timeline")
    return (
      <div className="cv-page" style={wrap}>
        <header style={{ padding: "34px 40px 18px", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", borderBottom: `3px solid ${color}` }}>
          <div>
            <h1 style={{ fontSize: px(28, c), margin: 0, color }}>{cv.name}</h1>
            <p style={{ margin: "4px 0 6px", fontSize: px(13.5, c), fontWeight: 600 }}>{cv.headline}</p>
            {contact}
          </div>
          {cv.photo && <img src={cv.photo} alt="" style={photoStyle(88, 88, "50%")} />}
        </header>
        <main style={{ padding: "20px 40px 36px" }}>{cv.sections.map((s) => renderSec(s, s.kind === "items"))}</main>
      </div>
    );

  const center = t.layout === "classic" || t.layout === "compact";
  return (
    <div className="cv-page" style={wrap}>
      {t.layout === "banner" ? (
        <header style={{ background: color, color: "#fff", padding: "28px 40px", display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: px(28, c), margin: 0 }}>{cv.name}</h1>
            <p style={{ margin: "4px 0 8px", fontSize: px(13.5, c) }}>{cv.headline}</p>
            {contact}
          </div>
          {cv.photo && <img src={cv.photo} alt="" style={photoStyle(90, 90, "50%")} />}
        </header>
      ) : (
        <header style={{ textAlign: center ? "center" : "left", padding: "36px 40px 0" }}>
          {cv.photo && <div style={{ display: "flex", justifyContent: center ? "center" : "flex-start", marginBottom: 10 }}><img src={cv.photo} alt="" style={photoStyle(84, 84, "50%")} /></div>}
          <h1 style={{ fontSize: px(26, c), margin: 0, color }}>{cv.name}</h1>
          <p style={{ margin: "4px 0 6px", fontSize: px(13.5, c), fontWeight: 600 }}>{cv.headline}</p>
          {contact}
        </header>
      )}
      <main style={{ padding: "18px 40px 36px" }}>{secs}</main>
    </div>
  );
}
