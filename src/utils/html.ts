// Decodifica delle entity HTML nel testo che arriva dalle API (Esse3/Elly
// restituiscono i campi HTML-escaped, es. "flex &amp; bison").

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"); // per ultimo: evita di sovra-decodificare "&amp;lt;"
}

// Applica decodeEntities a tutte le stringhe di una struttura JSON (ricorsivo).
// No-op su numeri/boolean/null e sui codici (non contengono entity).
export function decodeEntitiesDeep<T>(value: T): T {
  if (typeof value === "string") return decodeEntities(value) as T;
  if (Array.isArray(value)) return value.map(decodeEntitiesDeep) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = decodeEntitiesDeep(v);
    return out as T;
  }
  return value;
}
