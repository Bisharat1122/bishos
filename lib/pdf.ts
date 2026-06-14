"use client";

import * as pdfjsLib from "pdfjs-dist";

// Match the worker to the installed version exactly (served from unpkg).
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/** Extract plain text from a PDF File in the browser. Returns "" for non-PDFs or on failure. */
export async function extractPdfText(file: File): Promise<string> {
  if (file.type !== "application/pdf") return "";
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const maxPages = Math.min(pdf.numPages, 100);
    let text = "";
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => (it as { str?: string }).str ?? "").join(" ") + "\n";
    }
    return text.trim();
  } catch (e) {
    console.error("PDF text extraction failed:", e);
    return "";
  }
}
