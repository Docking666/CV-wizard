declare module "pdf-parse" {
  function pdfParse(buffer: Buffer): Promise<{ text: string; numpages: number; info: Record<string, unknown> }>;
  export = pdfParse;
}
