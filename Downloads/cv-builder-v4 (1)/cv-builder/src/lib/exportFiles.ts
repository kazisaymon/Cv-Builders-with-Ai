export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function fileBase(name: string) {
  const s = name.trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-");
  return s && s.toUpperCase() !== "YOUR-NAME" ? `${s}-CV` : "CV";
}

// Draws the A4 page node to a PNG. Web fonts are embedded; if that fails the image is still produced.
export async function pageToPng(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import("html-to-image");
  await document.fonts?.ready;
  const opts = { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true };
  let blob: Blob | null = null;
  try {
    blob = await toBlob(node, opts);
  } catch {
    blob = await toBlob(node, { ...opts, skipFonts: true });
  }
  if (!blob) throw new Error("Could not create the image.");
  return blob;
}
