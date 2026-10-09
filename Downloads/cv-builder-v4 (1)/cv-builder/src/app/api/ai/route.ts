import { NextResponse } from "next/server";
import { CHAT_PROMPT } from "@/lib/prompts";
import { firstOf, friendlyError, gemini, groq } from "@/lib/llm";

export const maxDuration = 30;

const PROMPTS: Record<string, (lang: string) => string> = {
  improve: () => "Rewrite the CV text to be clear, concise and achievement-focused. Keep facts unchanged, do not invent anything. Keep the same line structure (one bullet per line). Return only the rewritten text.",
  summary: () => "Write a 3-4 sentence professional CV summary from the given CV content. Do not invent facts. Return only the summary.",
  translate: (lang) => `Translate the CV text into ${lang}. Keep names, numbers, links and line breaks. Return only the translation.`,
  fix: () => "Fix spelling and grammar only, in the same language. Return only the corrected text.",
  chat: () => CHAT_PROMPT,
};

type Turn = { role: "user" | "ai"; text: string };

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { task, text, lang = "English", provider = "groq", context, history } = body as {
    task: string; text: unknown; lang?: string; provider?: string; context?: unknown; history?: unknown;
  };
  if (typeof task !== "string" || !PROMPTS[task] || typeof text !== "string" || !text.trim() || text.length > 8000)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  let user = text;
  if (task === "chat") {
    if (typeof context !== "string" || context.length > 20000) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const turns = (Array.isArray(history) ? history : [])
      .filter((h): h is Turn => !!h && typeof (h as Turn).text === "string" && ((h as Turn).role === "user" || (h as Turn).role === "ai"))
      .slice(-6)
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text.slice(0, 600)}`)
      .join("\n");
    user = `CURRENT_CV:\n${context}\n\nEARLIER CHAT:\n${turns || "(none)"}\n\nREQUEST:\n${text}`;
  }

  const json = task === "chat";
  const system = PROMPTS[task](String(lang));
  const g = () => groq(system, user, json);
  const m = () => gemini(system, [{ text: user }], json);
  try {
    const out = await firstOf(provider === "gemini" ? [m, g] : [g, m]);
    return NextResponse.json({ text: out });
  } catch (e) {
    return NextResponse.json({ error: friendlyError(e) }, { status: 502 });
  }
}
