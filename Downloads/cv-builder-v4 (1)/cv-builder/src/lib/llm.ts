// Thin server-side wrappers for Groq and Gemini. API keys never leave the server.

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

const MAX_TOKENS = 4500;
const hasGroq = () => !!process.env.GROQ_API_KEY;
const hasGemini = () => !!process.env.GEMINI_API_KEY;
export const hasAnyKey = () => hasGroq() || hasGemini();
export { hasGemini, hasGroq };

export async function groq(system: string, text: string, json = false, timeoutMs = 25000): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing");
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: json ? 0.4 : 0.3,
      ...(json ? { response_format: { type: "json_object" }, max_tokens: MAX_TOKENS } : {}),
      messages: [{ role: "system", content: system }, { role: "user", content: text }],
    }),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content as string;
}

// Best-effort image reading on Groq. Gemini is the reliable path for images.
export async function groqVision(system: string, text: string, mimeType: string, base64: string, timeoutMs = 25000): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing");
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.3,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: system },
        { role: "user", content: [{ type: "text", text }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }] },
      ],
    }),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content as string;
}

export async function gemini(system: string, parts: Part[], json = false, timeoutMs = 25000): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: json ? { temperature: 0.4, responseMimeType: "application/json", maxOutputTokens: MAX_TOKENS } : { temperature: 0.3 },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") as string;
}

// Try providers in order and return the first non-empty answer. Throws the last error if all fail.
export async function firstOf(attempts: (() => Promise<string>)[]): Promise<string> {
  let last: unknown = new Error("AI is unavailable.");
  for (const run of attempts) {
    try {
      const out = await run();
      if (out && out.trim()) return out.trim();
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

export function friendlyError(e: unknown): string {
  if (!hasAnyKey()) return "No AI key is set. Add GROQ_API_KEY or GEMINI_API_KEY to .env.local (or to Vercel environment variables).";
  const m = e instanceof Error ? e.message : "";
  if (/\b429\b/.test(m)) return "The AI is busy right now (rate limit). Wait a minute and try again.";
  if (/\b(401|403)\b/.test(m)) return "The AI key was rejected. Check GROQ_API_KEY / GEMINI_API_KEY.";
  if (/timeout|aborted/i.test(m)) return "The AI took too long. Try again, or send a shorter request.";
  return "AI is unavailable. Check your API keys.";
}
