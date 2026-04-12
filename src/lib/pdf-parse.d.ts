/* Type declarations for pdf-parse */
declare module "pdf-parse" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }

  function pdf(buffer: Buffer): Promise<PDFData>;
  export = pdf;
}
