import { Platform } from "react-native";

export const API_TIMEOUT = 60_000;

export const STORAGE_KEYS = {
  // Credenziali Unipr (stesse per Esse3 ed Elly), cifrate in SecureStore.
  UNIPR_USER: "unidesk_user",
  UNIPR_PASS: "unidesk_pass",
  MATRICOLA: "unidesk_matricola",
  FIRST_LAUNCH: "first_launch",
} as const;

// Fix emulatore Android: localhost/127.0.0.1 → 10.0.2.2 (host della macchina).
function androidLocalhost(url: string): string {
  if (Platform.OS !== "android") return url;
  return url.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
}

// Base REST Esse3 (e3rest): chiamate dirette da device con HTTP Basic.
export const ESSE3_BASE =
  process.env.EXPO_PUBLIC_ESSE3_BASE ??
  "https://unipr.esse3.cineca.it/e3rest/api";

// Base del sito web Esse3 (non REST), per deep-link (es. questionario OPIS).
export const ESSE3_WEB_BASE = ESSE3_BASE.replace(/\/e3rest\/api\/?$/, "");

// Backend Unidesk (Next.js) per i corsi Elly. Vuoto = tab Corsi disabilitata.
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
export const API_BASE_URL = rawApiUrl
  ? androidLocalhost(rawApiUrl).replace(/\/+$/, "")
  : "";
export const HAS_BACKEND = API_BASE_URL.length > 0;
