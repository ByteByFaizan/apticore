/* ═══════════════════════════════════════════════
   PDF/DOCX Parser — Robust Text Extraction
   Uses pdfjs-dist (Mozilla PDF.js) for reliable PDF parsing
   Production-grade: fallback strategies, quality validation,
   multi-column support, text cleaning pipeline
   ═══════════════════════════════════════════════ */

import { logger } from "./logger";

// ── Ligature & encoding artifact map ──
const LIGATURE_MAP: Record<string, string> = {
  "\uFB00": "ff",
  "\uFB01": "fi",
  "\uFB02": "fl",
  "\uFB03": "ffi",
  "\uFB04": "ffl",
  "\uFB05": "st",
  "\uFB06": "st",
  "\u2019": "'",
  "\u2018": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u00A0": " ", // non-breaking space
  "\u200B": "",  // zero-width space
  "\u200C": "",  // zero-width non-joiner
  "\u200D": "",  // zero-width joiner
  "\uFEFF": "",  // BOM
};

// ── Section header patterns for resume reconstruction ──
const SECTION_HEADERS = /^(EDUCATION|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|SKILLS|TECHNICAL SKILLS|PROJECTS|CERTIFICATIONS|CERTIFICATES|ACHIEVEMENTS|AWARDS|SUMMARY|OBJECTIVE|PROFILE|CONTACT|PERSONAL INFORMATION|LANGUAGES|INTERESTS|HOBBIES|PUBLICATIONS|REFERENCES|VOLUNTEER|ACTIVITIES|EXTRACURRICULAR)\s*:?\s*$/i;

// ═══════════════════════════════════════════════
// PDF.js Setup — Lazy loaded, singleton
// ═══════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFJSModule = any;
let pdfjsModule: PDFJSModule | null = null;

/**
 * Polyfill DOM APIs required by pdfjs-dist in Node.js / Vercel serverless.
 * pdfjs-dist uses DOMMatrix for glyph transform matrices during text extraction.
 * Without these polyfills, all PDFs fail with "DOMMatrix is not defined".
 */
function ensureDOMPolyfills(): void {
  const g = globalThis as Record<string, unknown>;

  // DOMMatrix — used by pdfjs-dist for text position/transform calculations
  if (typeof g.DOMMatrix === "undefined") {
    class DOMMatrixPolyfill {
      a: number; b: number; c: number; d: number; e: number; f: number;
      m11: number; m12: number; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41: number; m42: number; m43 = 0; m44 = 1;
      is2D = true; isIdentity: boolean;

      constructor(init?: number[] | Float32Array | Float64Array | string) {
        if (Array.isArray(init) || init instanceof Float32Array || init instanceof Float64Array) {
          const v = Array.from(init);
          if (v.length === 6) {
            [this.a, this.b, this.c, this.d, this.e, this.f] = v;
          } else if (v.length === 16) {
            this.a = v[0]; this.b = v[1]; this.c = v[4]; this.d = v[5];
            this.e = v[12]; this.f = v[13]; this.is2D = false;
            this.m13 = v[2]; this.m14 = v[3];
            this.m21 = v[4]; this.m22 = v[5]; this.m23 = v[6]; this.m24 = v[7];
            this.m31 = v[8]; this.m32 = v[9]; this.m33 = v[10]; this.m34 = v[11];
            this.m43 = v[14]; this.m44 = v[15];
          } else {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
          }
        } else {
          this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
        }
        // Sync aliases
        this.m11 = this.a; this.m12 = this.b;
        this.m21 = this.m21 ?? this.c; this.m22 = this.m22 ?? this.d;
        this.m41 = this.e; this.m42 = this.f;
        this.isIdentity = this.a === 1 && this.b === 0 && this.c === 0 &&
          this.d === 1 && this.e === 0 && this.f === 0;
      }

      multiply(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
        return new DOMMatrixPolyfill([
          this.a * other.a + this.c * other.b,
          this.b * other.a + this.d * other.b,
          this.a * other.c + this.c * other.d,
          this.b * other.c + this.d * other.d,
          this.a * other.e + this.c * other.f + this.e,
          this.b * other.e + this.d * other.f + this.f,
        ]);
      }

      translate(tx: number, ty: number): DOMMatrixPolyfill {
        return this.multiply(new DOMMatrixPolyfill([1, 0, 0, 1, tx, ty]));
      }

      scale(sx: number, sy?: number): DOMMatrixPolyfill {
        return this.multiply(new DOMMatrixPolyfill([sx, 0, 0, sy ?? sx, 0, 0]));
      }

      inverse(): DOMMatrixPolyfill {
        const det = this.a * this.d - this.b * this.c;
        if (det === 0) return new DOMMatrixPolyfill([0, 0, 0, 0, 0, 0]);
        return new DOMMatrixPolyfill([
          this.d / det, -this.b / det,
          -this.c / det, this.a / det,
          (this.c * this.f - this.d * this.e) / det,
          (this.b * this.e - this.a * this.f) / det,
        ]);
      }

      transformPoint(point?: { x?: number; y?: number }): { x: number; y: number } {
        const x = point?.x ?? 0, y = point?.y ?? 0;
        return { x: this.a * x + this.c * y + this.e, y: this.b * x + this.d * y + this.f };
      }

      static fromMatrix(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
        return new DOMMatrixPolyfill([other.a, other.b, other.c, other.d, other.e, other.f]);
      }
    }
    g.DOMMatrix = DOMMatrixPolyfill;
  }

  // Path2D — pdfjs-dist tries to polyfill but warns if missing; stub it
  if (typeof g.Path2D === "undefined") {
    g.Path2D = class Path2DStub {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_d?: string) { /* no-op for text extraction */ }
      addPath() {}; closePath() {}; moveTo() {}; lineTo() {};
      bezierCurveTo() {}; quadraticCurveTo() {}; arc() {}; rect() {};
    };
  }

  // ImageData — pdfjs-dist tries to polyfill but warns if missing; stub it
  if (typeof g.ImageData === "undefined") {
    g.ImageData = class ImageDataStub {
      data: Uint8ClampedArray; width: number; height: number;
      constructor(sw: number | Uint8ClampedArray, sh?: number, _sh2?: number) {
        if (typeof sw === "number") {
          this.width = sw; this.height = sh ?? 0;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
          this.data = sw; this.width = sh ?? 0; this.height = _sh2 ?? 0;
        }
      }
    };
  }
}

/**
 * Lazy-load pdfjs-dist legacy build for Node.js server environment.
 * Polyfills DOM APIs first, then loads the worker inline.
 */
async function getPDFJS(): Promise<PDFJSModule> {
  if (pdfjsModule) return pdfjsModule;

  // Must polyfill BEFORE importing pdfjs-dist
  ensureDOMPolyfills();

  // Use legacy build for Node.js compatibility
  pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Load worker inline
  await import("pdfjs-dist/legacy/build/pdf.worker.mjs");

  return pdfjsModule;
}

// ═══════════════════════════════════════════════
// Text Preprocessing Pipeline
// ═══════════════════════════════════════════════

/**
 * Preprocess raw extracted text — full cleaning pipeline.
 * Transforms garbled PDF output into clean, structured text.
 */
function preprocessResumeText(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // Step 1: Unicode NFC normalization
  text = text.normalize("NFC");

  // Step 2: Expand ligatures and fix encoding artifacts
  for (const [ligature, replacement] of Object.entries(LIGATURE_MAP)) {
    text = text.split(ligature).join(replacement);
  }

  // Step 3: Strip non-printable characters (keep newlines, tabs, printable)
  text = text.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, "");

  // Step 4: Fix null bytes (common in corrupt PDFs)
  text = text.replace(/\0/g, "");

  // Step 5: Normalize line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Step 6: Fix word hyphenation across lines (e.g., "soft-\nware" → "software")
  text = text.replace(/(\w)-\n(\w)/g, "$1$2");

  // Step 7: Fix broken whitespace within words
  // Detect single-character spacing (e.g., "S k i l l s" → "Skills")
  text = text.replace(/\b(\w)\s(\w)\s(\w)\s(\w)\s(\w)\b/g, (match) => {
    const chars = match.split(/\s+/);
    if (chars.every((c) => c.length === 1)) {
      return chars.join("");
    }
    return match;
  });

  // Step 8: Normalize whitespace runs (multiple spaces → single)
  text = text.replace(/[ \t]+/g, " ");

  // Step 9: Remove page numbers and common headers/footers
  text = text.replace(/^\s*(?:page\s*\d+\s*(?:of\s*\d+)?|\d+\s*$)\s*$/gim, "");
  text = text.replace(/^\s*(?:resume|curriculum vitae|cv)\s*$/gim, "");

  // Step 10: Fix excessive blank lines (3+ → 2)
  text = text.replace(/\n{3,}/g, "\n\n");

  // Step 11: Ensure section headers are properly separated
  text = text.replace(
    /([^\n])\n((?:EDUCATION|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|SKILLS|TECHNICAL SKILLS|PROJECTS|CERTIFICATIONS|SUMMARY|OBJECTIVE|PROFILE|CONTACT)\s*:?\s*$)/gim,
    "$1\n\n$2"
  );

  // Step 12: Trim each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Step 13: Final trim
  return text.trim();
}

/**
 * Detect and fix multi-column text layout.
 * PDF text extraction often interleaves columns — this detects and reorders.
 */
function fixMultiColumnLayout(text: string): string {
  const lines = text.split("\n");
  if (lines.length < 5) return text;

  // Heuristic: detect column layout by checking for consistent mid-line gaps
  let midGapLines = 0;
  const midGapPattern = /\S {3,}\S/;

  for (const line of lines) {
    if (midGapPattern.test(line)) {
      midGapLines++;
    }
  }

  // If less than 20% of lines have mid-gaps, not multi-column
  if (midGapLines / lines.length < 0.2) return text;

  // Split columns: left side and right side
  const leftColumn: string[] = [];
  const rightColumn: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(.+?)\s{3,}(.+)$/);
    if (match) {
      leftColumn.push(match[1].trim());
      rightColumn.push(match[2].trim());
    } else {
      leftColumn.push(line.trim());
    }
  }

  const reconstructed = [...leftColumn.filter(Boolean), "", ...rightColumn.filter(Boolean)].join("\n");

  logger.debug("[PDF] Multi-column layout detected and fixed", {
    originalLines: lines.length,
    midGapLines,
  });

  return reconstructed;
}

/**
 * Score extracted text quality (0-100).
 * Used to decide if fallback parsing is needed.
 */
function scoreTextQuality(text: string): number {
  if (!text) return 0;

  let score = 100;

  // Penalty: too short
  if (text.length < 100) score -= 40;
  else if (text.length < 300) score -= 20;

  // Penalty: high ratio of non-alphabetic characters (garbled text)
  const alphaChars = (text.match(/[a-zA-Z]/g) || []).length;
  const alphaRatio = alphaChars / Math.max(text.length, 1);
  if (alphaRatio < 0.3) score -= 30;
  else if (alphaRatio < 0.5) score -= 15;

  // Penalty: very few words
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 20) score -= 25;
  else if (wordCount < 50) score -= 10;

  // Penalty: no recognizable resume sections
  if (!SECTION_HEADERS.test(text) && !text.toLowerCase().includes("experience") && !text.toLowerCase().includes("education") && !text.toLowerCase().includes("skill")) {
    score -= 15;
  }

  // Penalty: excessive special characters (encoding issues)
  const specialChars = (text.match(/[^\w\s.,;:!?@()\-/]/g) || []).length;
  const specialRatio = specialChars / Math.max(text.length, 1);
  if (specialRatio > 0.1) score -= 20;
  else if (specialRatio > 0.05) score -= 10;

  // Bonus: has email pattern (likely real resume)
  if (/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(text)) score += 5;

  // Bonus: has phone pattern
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ═══════════════════════════════════════════════
// PDF Text Extraction — pdfjs-dist (Mozilla PDF.js)
// ═══════════════════════════════════════════════

/**
 * Extract text from a PDF buffer using pdfjs-dist.
 * Position-aware extraction preserves reading order for multi-column resumes.
 * Handles corrupt PDFs gracefully — no unhandled rejections.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  status: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
  quality: number;
  error?: string;
}> {
  try {
    const pdfjs = await getPDFJS();
    const data = new Uint8Array(buffer);

    // Load PDF document with recovery mode enabled
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      isEvalSupported: false, // Security: no eval in Next.js
      disableFontFace: true,  // No DOM font loading in server
    });

    const doc = await loadingTask.promise;
    const numPages = doc.numPages;

    if (numPages === 0) {
      return {
        text: "",
        status: "PARSE_FAILED",
        quality: 0,
        error: "PDF has no pages",
      };
    }

    // Extract text from all pages with position awareness
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await doc.getPage(pageNum);
        const content = await page.getTextContent({
          includeMarkedContent: false,
        });

        if (!content.items || content.items.length === 0) {
          continue;
        }

        // Position-aware text extraction
        // Sort items by Y position (top→bottom), then X position (left→right)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = content.items.filter((item: any) => item.str !== undefined);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortedItems = [...items].sort((a: any, b: any) => {
          // Y is inverted in PDF coordinate space (0 at bottom)
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 3) return yDiff; // Different lines (3px threshold)
          return a.transform[4] - b.transform[4]; // Same line: left→right
        });

        // Build lines from positioned text items
        const lines: string[] = [];
        let currentLine = "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let lastY = sortedItems[0]?.transform?.[5] ?? 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let lastX = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let lastWidth = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of sortedItems as any[]) {
          const text = item.str;
          if (!text && !item.hasEOL) continue;

          const y = item.transform[5];
          const x = item.transform[4];

          // New line detection (Y position changed)
          if (Math.abs(y - lastY) > 3) {
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }
            currentLine = text;
            lastY = y;
            lastX = x;
            lastWidth = item.width || 0;
          } else {
            // Same line — check for gap between items (column separator)
            const gap = x - (lastX + lastWidth);
            if (gap > 15 && currentLine.length > 0) {
              // Large gap — likely column separator, use multiple spaces
              currentLine += "   " + text;
            } else if (gap > 2 || currentLine.endsWith(" ") || text.startsWith(" ")) {
              currentLine += text;
            } else {
              // Items adjacent — may need a space
              currentLine += (currentLine && !currentLine.endsWith(" ") && text && !text.startsWith(" ") ? " " : "") + text;
            }
            lastX = x;
            lastWidth = item.width || 0;
          }
        }

        // Push last line
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        if (lines.length > 0) {
          pageTexts.push(lines.join("\n"));
        }
      } catch (pageErr) {
        // Individual page failure — continue with other pages
        logger.warn("[PDF] Page extraction failed", {
          page: pageNum,
          error: pageErr instanceof Error ? pageErr.message : "Unknown",
        });
      }
    }

    // Cleanup
    await doc.destroy();

    const rawText = pageTexts.join("\n\n");

    // Check if very little text was extracted
    if (rawText.trim().length < 50) {
      return {
        text: rawText.trim(),
        status: "NEEDS_OCR",
        quality: 0,
        error: "Very little text extracted — this may be a scanned/image-only PDF. OCR processing required.",
      };
    }

    // Apply full cleaning pipeline
    const cleaned = preprocessResumeText(fixMultiColumnLayout(rawText));
    const quality = scoreTextQuality(cleaned);

    logger.debug("[PDF] Extraction complete", {
      pages: numPages,
      rawLength: rawText.length,
      cleanedLength: cleaned.length,
      quality,
    });

    return { text: cleaned, status: "SUCCESS", quality };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";

    // Check for specific recoverable errors
    if (errorMsg.includes("XRef") || errorMsg.includes("Invalid PDF")) {
      return {
        text: "",
        status: "PARSE_FAILED",
        quality: 0,
        error: `PDF structure error (possibly corrupted): ${errorMsg}`,
      };
    }

    return {
      text: "",
      status: "PARSE_FAILED",
      quality: 0,
      error: `PDF parsing failed: ${errorMsg}`,
    };
  }
}

// ═══════════════════════════════════════════════
// DOCX Text Extraction — JSZip
// ═══════════════════════════════════════════════

/**
 * Extract text from a DOCX buffer.
 * DOCX = ZIP archive containing word/document.xml.
 * Uses JSZip to properly unpack the archive and extract paragraph text.
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<{
  text: string;
  status: "SUCCESS" | "PARSE_FAILED";
  quality: number;
  error?: string;
}> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);

    const documentXml = zip.file("word/document.xml");
    if (!documentXml) {
      return {
        text: "",
        status: "PARSE_FAILED",
        quality: 0,
        error: "Invalid DOCX: word/document.xml not found in archive",
      };
    }

    const xmlContent = await documentXml.async("text");

    // Extract text from paragraphs with proper structure
    const paragraphs: string[] = [];
    const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
    let paraMatch: RegExpExecArray | null;

    while ((paraMatch = paraRegex.exec(xmlContent)) !== null) {
      const paraXml = paraMatch[0];
      const paraTexts: string[] = [];
      const innerWtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let innerMatch: RegExpExecArray | null;

      while ((innerMatch = innerWtRegex.exec(paraXml)) !== null) {
        if (innerMatch[1]) {
          paraTexts.push(innerMatch[1]);
        }
      }

      if (paraTexts.length > 0) {
        paragraphs.push(paraTexts.join(""));
      }
    }

    // Fallback: flat w:t extraction
    if (paragraphs.length === 0) {
      const textParts: string[] = [];
      const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let match: RegExpExecArray | null;

      while ((match = wtRegex.exec(xmlContent)) !== null) {
        if (match[1]) {
          textParts.push(match[1]);
        }
      }

      if (textParts.length > 0) {
        const text = preprocessResumeText(textParts.join(" "));
        const quality = scoreTextQuality(text);
        return { text, status: "SUCCESS", quality };
      }
    }

    const rawText = paragraphs.join("\n");

    if (rawText.trim().length < 10) {
      return {
        text: "",
        status: "PARSE_FAILED",
        quality: 0,
        error: "Could not extract meaningful text from DOCX",
      };
    }

    const text = preprocessResumeText(rawText);
    const quality = scoreTextQuality(text);

    logger.debug("DOCX extracted", {
      paragraphs: paragraphs.length,
      chars: text.length,
      quality,
    });

    return { text, status: "SUCCESS", quality };
  } catch (err) {
    return {
      text: "",
      status: "PARSE_FAILED",
      quality: 0,
      error: `DOCX parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

// ═══════════════════════════════════════════════
// File Type Detection
// ═══════════════════════════════════════════════

/**
 * Detect file type from buffer magic bytes.
 */
function detectFileType(buffer: Buffer): "pdf" | "docx" | "txt" | "unknown" {
  if (buffer.length < 4) return "unknown";

  // PDF magic bytes: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "pdf";
  }

  // PK magic bytes → ZIP-based format
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    const head = buffer.subarray(0, Math.min(buffer.length, 2000)).toString("binary");
    if (head.includes("word/")) {
      return "docx";
    }
    return "unknown";
  }

  // UTF-8 BOM (EF BB BF) → treat as TXT
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return "txt";
  }

  return "txt";
}

// ═══════════════════════════════════════════════
// Main Entry Point
// ═══════════════════════════════════════════════

/**
 * Extract text from a file buffer (auto-detect type).
 * Uses magic bytes first, falls back to fileName extension.
 * Returns cleaned, preprocessed text ready for AI parsing.
 */
export async function extractText(buffer: Buffer, fileName?: string): Promise<{
  text: string;
  status: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
  fileType: "pdf" | "docx" | "txt" | "unknown";
  quality: number;
  error?: string;
}> {
  if (!buffer || buffer.length === 0) {
    return {
      text: "",
      status: "PARSE_FAILED",
      fileType: "unknown",
      quality: 0,
      error: "Empty file buffer",
    };
  }

  let fileType = detectFileType(buffer);

  // Extension fallback
  if (fileType === "txt" && fileName) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".pdf")) fileType = "pdf";
    else if (lowerName.endsWith(".docx")) fileType = "docx";
    else if (!lowerName.endsWith(".txt")) fileType = "unknown";
  }

  if (fileType === "unknown" && fileName) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".pdf")) fileType = "pdf";
    else if (lowerName.endsWith(".docx")) fileType = "docx";
    else if (lowerName.endsWith(".txt")) fileType = "txt";
  }

  switch (fileType) {
    case "pdf": {
      const result = await extractTextFromPDF(buffer);
      return { ...result, fileType };
    }
    case "docx": {
      const result = await extractTextFromDOCX(buffer);
      return { ...result, fileType };
    }
    case "txt": {
      let text = buffer.toString("utf8");
      if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
      }
      const cleaned = preprocessResumeText(text);
      const quality = scoreTextQuality(cleaned);
      return { text: cleaned, status: "SUCCESS", fileType, quality };
    }
    default:
      return {
        text: "",
        status: "PARSE_FAILED",
        fileType: "unknown",
        quality: 0,
        error: "Unsupported file type. Only PDF, DOCX, and TXT are accepted.",
      };
  }
}

// ── Validation constants ──
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_BATCH = 50;
export const ALLOWED_TYPES = [
  "application/pdf", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];
export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
