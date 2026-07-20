// Categorizzazione dei file Elly per icona e viewer, da filename/mimetype/nome/url.

export type FileCategory =
  | "pdf"
  | "image"
  | "word"
  | "excel"
  | "ppt"
  | "archive"
  | "text"
  | "other";

export interface FileMeta {
  filename?: string;
  mimetype?: string;
  name?: string;
  url?: string;
}

function extOf(s?: string): string {
  if (!s) return "";
  const clean = s.split("?")[0].split("#")[0];
  const base = clean.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

// Prima estensione ricavabile tra i candidati (filename backend → nome → url).
export function getExtension(meta: FileMeta): string {
  return extOf(meta.filename) || extOf(meta.name) || extOf(meta.url);
}

const BY_EXT: Record<string, FileCategory> = {
  pdf: "pdf",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  bmp: "image",
  heic: "image",
  doc: "word",
  docx: "word",
  odt: "word",
  rtf: "word",
  xls: "excel",
  xlsx: "excel",
  ods: "excel",
  csv: "excel",
  ppt: "ppt",
  pptx: "ppt",
  odp: "ppt",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  txt: "text",
  md: "text",
};

function fromMime(mime?: string): FileCategory | null {
  if (!mime) return null;
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (/word|opendocument\.text|msword/.test(mime)) return "word";
  if (/excel|spreadsheet|csv/.test(mime)) return "excel";
  if (/powerpoint|presentation/.test(mime)) return "ppt";
  if (/zip|compressed|x-7z|x-rar|tar|gzip/.test(mime)) return "archive";
  if (mime.startsWith("text/")) return "text";
  return null;
}

export function fileCategory(meta: FileMeta): FileCategory {
  return fromMime(meta.mimetype) ?? BY_EXT[getExtension(meta)] ?? "other";
}

// Etichetta estensione (es. "PDF") o stringa vuota se non ricavabile.
export function fileExtLabel(meta: FileMeta): string {
  return getExtension(meta).toUpperCase();
}

// Categorie con viewer in-app (PDF via react-native-pdf, immagini via expo-image).
export function isInAppViewable(cat: FileCategory): cat is "pdf" | "image" {
  return cat === "pdf" || cat === "image";
}
