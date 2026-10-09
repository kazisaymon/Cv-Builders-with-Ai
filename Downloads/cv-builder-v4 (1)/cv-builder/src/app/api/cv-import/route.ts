import { NextResponse } from "next/server";
import { EXTRACT_PROMPT } from "@/lib/prompts";
import { firstOf, friendlyError, gemini, groq, groqVision, hasAnyKey, hasGemini, hasGroq } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4_000_000; // Vercel functions accept request bodies up to about 4.5 MB.
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function pdfText(buf: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

async function docxText(buf: Buffer): Promise<string> {
  const mod = await import("mammoth");
  const extract = mod.extractRawText ?? mod.default.extractRawText;
  const { value } = await extract({ buffer: buf });
  return value;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Could not read the upload.");
  }
  const file = form.get("file");
  const note = typeof form.get("note") === "string" ? (form.get("note") as string).trim().slice(0, 1000) : "";
  if (!(file instanceof File)) return bad("No file received.");
  if (file.size > MAX_BYTES) return bad("That file is too large. The limit is 4 MB.", 413);
  if (!hasAnyKey()) return bad(friendlyError(null), 502);

  const name = file.name.toLowerCase();
  const type = file.type;
  const buf = Buffer.from(await file.arrayBuffer());
  const noteLine = note ? `NOTE FROM THE USER: ${note}\n\n` : "";

  try {
    // Images: read with Gemini (best) or Groq vision.
    if (/^image\/(jpeg|png|webp)$/.test(type) || /\.(jpe?g|png|webp)$/.test(name)) {
      const mime = type.startsWith("image/") ? type : name.endsWith("png") ? "image/png" : name.endsWith("webp") ? "image/webp" : "image/jpeg";
      const b64 = buf.toString("base64");
      const prompt = `${noteLine}Convert the CV in this image.`;
      const attempts: (() => Promise<string>)[] = [];
      if (hasGemini()) attempts.push(() => gemini(EXTRACT_PROMPT, [{ text: prompt }, { inlineData: { mimeType: mime, data: b64 } }], true, 40000));
      if (hasGroq()) attempts.push(() => groqVision(EXTRACT_PROMPT, prompt, mime, b64, 40000));
      return NextResponse.json({ text: await firstOf(attempts) });
    }

    // PDF: Gemini reads the file directly (works for scans too); otherwise use the text layer.
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      if (hasGemini()) {
        try {
          const out = await gemini(EXTRACT_PROMPT, [{ text: `${noteLine}Convert the CV in this PDF.` }, { inlineData: { mimeType: "application/pdf", data: buf.toString("base64") } }], true, 40000);
          if (out.trim()) return NextResponse.json({ text: out.trim() });
        } catch {
          /* fall back to the text layer */
        }
      }
      const text = (await pdfText(buf)).trim();
      if (text.length < 80)
        return bad("This PDF has no readable text (it looks scanned). Add GEMINI_API_KEY to read scanned PDFs, or upload a clear photo or screenshot instead.");
      const user = `${noteLine}CV TEXT:\n${text.slice(0, 15000)}`;
      return NextResponse.json({ text: await firstOf([() => groq(EXTRACT_PROMPT, user, true, 40000), () => gemini(EXTRACT_PROMPT, [{ text: user }], true, 40000)]) });
    }

    // Word and plain text.
    let text = "";
    if (name.endsWith(".docx")) text = await docxText(buf);
    else if (name.endsWith(".doc")) return bad("Old .doc files are not supported. Save the file as .docx or PDF and upload it again.");
    else if (type.startsWith("text/") || /\.(txt|md)$/.test(name)) text = buf.toString("utf8");
    else return bad("Unsupported file. Upload a photo (JPG, PNG, WebP), a PDF, a .docx or a .txt file.");

    text = text.trim();
    if (text.length < 40) return bad("I could not find any text in that file.");
    const user = `${noteLine}CV TEXT:\n${text.slice(0, 15000)}`;
    return NextResponse.json({ text: await firstOf([() => groq(EXTRACT_PROMPT, user, true, 40000), () => gemini(EXTRACT_PROMPT, [{ text: user }], true, 40000)]) });
  } catch (e) {
    return bad(friendlyError(e), 502);
  }
}
