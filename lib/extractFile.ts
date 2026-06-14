"use client";

import { extractPdfText } from "./pdf";

/** OCR an image file (or canvas) to text via Tesseract.js (lazy-loaded). */
async function ocr(input: File | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(input);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

/** Render up to `maxPages` PDF pages to canvases and OCR them (for scanned PDFs). */
async function ocrPdf(file: File, maxPages = 10): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const n = Math.min(pdf.numPages, maxPages);
  let out = "";
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    const text = await ocr(canvas);
    if (text) out += `\n${text}\n`;
  }
  return out.trim();
}

/**
 * Extract readable text from a document so the AI can analyze it.
 * Supports PDF (with OCR fallback for scanned PDFs), DOCX, PPTX, XLSX/CSV,
 * plain text, and images (OCR). Heavy parsers are dynamically imported.
 */
export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  try {
    if (file.type.startsWith("image/")) {
      return await ocr(file);
    }

    if (file.type === "application/pdf" || name.endsWith(".pdf")) {
      const text = await extractPdfText(file);
      // If the PDF has little/no embedded text, it's likely scanned → OCR it.
      if (text.trim().length > 20) return text;
      return await ocrPdf(file);
    }

    if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth/mammoth.browser");
      const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return res.value.trim();
    }

    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      return wb.SheetNames.map(
        (s) => `## Sheet: ${s}\n${XLSX.utils.sheet_to_csv(wb.Sheets[s])}`,
      )
        .join("\n\n")
        .slice(0, 200000);
    }

    if (name.endsWith(".pptx")) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const slides = Object.keys(zip.files)
        .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
        .sort(
          (a, b) =>
            Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0) -
            Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0),
        );
      let out = "";
      let i = 1;
      for (const s of slides) {
        const xml = await zip.files[s].async("string");
        const texts = (xml.match(/<a:t>([^<]*)<\/a:t>/g) ?? []).map((m) =>
          m.replace(/<\/?a:t>/g, ""),
        );
        if (texts.length) out += `## Slide ${i}\n${texts.join(" ")}\n\n`;
        i++;
      }
      return out.trim();
    }

    if (
      file.type.startsWith("text/") ||
      /\.(txt|md|markdown|json|log|csv|tsv|yml|yaml)$/i.test(name)
    ) {
      return (await file.text()).slice(0, 200000);
    }

    return ""; // unsupported (legacy .doc, etc.)
  } catch (e) {
    console.error("extractFileText failed for", file.name, e);
    return "";
  }
}
