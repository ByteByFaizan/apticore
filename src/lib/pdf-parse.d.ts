/* Type stubs for pdfjs-dist legacy build (Node.js server context) */
declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export function getDocument(params: {
    data: Uint8Array;
    useSystemFonts?: boolean;
    isEvalSupported?: boolean;
    disableFontFace?: boolean;
  }): {
    promise: Promise<PDFDocumentProxy>;
  };

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }

  export interface PDFPageProxy {
    getTextContent(params?: {
      includeMarkedContent?: boolean;
    }): Promise<TextContent>;
  }

  export interface TextContent {
    items: TextItem[];
  }

  export interface TextItem {
    str: string;
    dir: string;
    transform: number[];
    width: number;
    height: number;
    hasEOL?: boolean;
  }
}

declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  // Worker module — side-effect import only
  const content: unknown;
  export default content;
}
