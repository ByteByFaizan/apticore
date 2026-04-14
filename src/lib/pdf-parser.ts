/* ═══════════════════════════════════════════════
   PDF/DOCX Parser — Text Extraction
   Uses pdf-parse for PDF, JSZip for DOCX
   ═══════════════════════════════════════════════ */

import pdf from "pdf-parse";
import { logger } from "./logger";

/**
 * Extract text from a PDF buffer.
 * Handles corrupted files and scanned PDFs gracefully.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  status: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
  error?: string;
}> {
  try {
    const data = await pdf(buffer);
    const text = data.text?.trim() || "";

    // Check for scanned PDF (very little text extracted)
    if (text.length < 50) {
      return {
        text,
        status: "NEEDS_OCR",
        error: "Very little text extracted — this may be a scanned/image-only PDF",
      };
    }

    return { text, status: "SUCCESS" };
  } catch (err) {
    return {
      text: "",
      status: "PARSE_FAILED",
      error: `PDF parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Extract text from a DOCX buffer.
 * DOCX = ZIP archive containing word/document.xml.
 * Uses JSZip to properly unpack the archive and extract paragraph text.
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<{
  text: string;
  status: "SUCCESS" | "PARSE_FAILED";
  error?: string;
}> {
  try {
    // Dynamic import to keep bundle lean when not used
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);

    // Main content is in word/document.xml
    const documentXml = zip.file("word/document.xml");
    if (!documentXml) {
      return {
        text: "",
        status: "PARSE_FAILED",
        error: "Invalid DOCX: word/document.xml not found in archive",
      };
    }

    const xmlContent = await documentXml.async("text");

    // Extract text from <w:t> tags (Word text elements)
    const textParts: string[] = [];
    // Match all <w:t ...>text</w:t> elements
    const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match: RegExpExecArray | null;

    while ((match = wtRegex.exec(xmlContent)) !== null) {
      if (match[1]) {
        textParts.push(match[1]);
      }
    }

    // Also detect paragraph breaks via <w:p> tags
    // Simple approach: join with spaces, insert newlines at paragraph boundaries
    const fullXml = xmlContent;
    const paragraphs: string[] = [];
    const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
    let paraMatch: RegExpExecArray | null;

    while ((paraMatch = paraRegex.exec(fullXml)) !== null) {
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

    const text = paragraphs.length > 0
      ? paragraphs.join("\n")
      : textParts.join(" ");

    if (text.trim().length < 10) {
      return {
        text: "",
        status: "PARSE_FAILED",
        error: "Could not extract meaningful text from DOCX",
      };
    }

    logger.debug("DOCX extracted", {
      paragraphs: paragraphs.length,
      chars: text.length,
    });

    return { text: text.trim(), status: "SUCCESS" };
  } catch (err) {
    return {
      text: "",
      status: "PARSE_FAILED",
      error: `DOCX parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Detect file type from buffer magic bytes.
 * Validates ZIP contents to distinguish DOCX from other ZIP formats (XLSX, PPTX, etc.)
 */
export function detectFileType(buffer: Buffer): "pdf" | "docx" | "txt" | "unknown" {
  if (buffer.length < 4) return "unknown";

  // PDF magic bytes: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "pdf";
  }

  // PK magic bytes → ZIP-based format (could be DOCX, XLSX, PPTX, plain ZIP)
  // Check for "[Content_Types].xml" marker which OOXML has near the start
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    // Quick heuristic: scan first ~2000 bytes for "word/" which only DOCX has
    const head = buffer.subarray(0, Math.min(buffer.length, 2000)).toString("binary");
    if (head.includes("word/")) {
      return "docx";
    }
    // If it's a ZIP but doesn't look like DOCX, return unknown
    // (prevents XLSX/PPTX/ZIP being misidentified and failing with confusing errors)
    return "unknown";
  }

  // UTF-8 BOM (EF BB BF) → treat as TXT
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return "txt";
  }

  // If no recognizable magic bytes → optimistically treat as text
  return "txt";
}

/**
 * Sanitize extracted text — remove null bytes and normalize whitespace.
 */
function sanitizeText(raw: string): string {
  return raw
    .replace(/\0/g, "")        // strip null bytes (common in corrupt PDFs)
    .replace(/\r\n/g, "\n")    // normalize line endings
    .replace(/\r/g, "\n")
    .trim();
}

/**
 * Extract text from a file buffer (auto-detect type).
 * Uses magic bytes first, falls back to fileName extension.
 */
export async function extractText(buffer: Buffer, fileName?: string): Promise<{
  text: string;
  status: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
  fileType: "pdf" | "docx" | "txt" | "unknown";
  error?: string;
}> {
  if (!buffer || buffer.length === 0) {
    return {
      text: "",
      status: "PARSE_FAILED",
      fileType: "unknown",
      error: "Empty file buffer",
    };
  }

  let fileType = detectFileType(buffer);

  // If magic bytes say "txt" but extension disagrees → use extension as tiebreaker
  if (fileType === "txt" && fileName) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".pdf")) fileType = "pdf";
    else if (lowerName.endsWith(".docx")) fileType = "docx";
    else if (!lowerName.endsWith(".txt")) fileType = "unknown";
  }

  // If magic bytes gave "unknown" but extension is known → trust extension
  if (fileType === "unknown" && fileName) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".pdf")) fileType = "pdf";
    else if (lowerName.endsWith(".docx")) fileType = "docx";
    else if (lowerName.endsWith(".txt")) fileType = "txt";
  }

  switch (fileType) {
    case "pdf": {
      const result = await extractTextFromPDF(buffer);
      return { ...result, fileType, text: sanitizeText(result.text) };
    }
    case "docx": {
      const result = await extractTextFromDOCX(buffer);
      return { ...result, fileType, text: sanitizeText(result.text) };
    }
    case "txt": {
      // Handle UTF-8 BOM
      let text = buffer.toString("utf8");
      if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
      }
      return { text: sanitizeText(text), status: "SUCCESS", fileType };
    }
    default:
      return {
        text: "",
        status: "PARSE_FAILED",
        fileType: "unknown",
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
