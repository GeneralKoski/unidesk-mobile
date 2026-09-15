import { API_BASE_URL, HAS_BACKEND } from "@/src/consts";
import { useAuthStore } from "@/src/stores/authStore";
import type { Course, Section } from "./types";

// I corsi Elly passano dal backend Unidesk (Next.js): il login SSO Shibboleth e
// il proxy dei materiali girano server-side e non sono replicabili on-device con
// fetch RN (niente redirect manuali né lettura di Set-Cookie). Qui riusiamo le
// stesse API route della web app; la sessione (cookie iron-session) è mantenuta
// automaticamente dal cookie jar nativo di React Native tra le richieste.

export class EllyBackendError extends Error {}
export class BackendNotConfiguredError extends EllyBackendError {
  constructor() {
    super("Backend Unidesk non configurato");
    this.name = "BackendNotConfiguredError";
  }
}

let loggedIn = false;
let loginPromise: Promise<void> | null = null;

// Da chiamare al logout per invalidare la sessione backend in memoria.
export function resetElly(): void {
  loggedIn = false;
  loginPromise = null;
}

async function doLogin(): Promise<void> {
  const creds = useAuthStore.getState().getCreds();
  if (!creds) throw new EllyBackendError("Non autenticato");
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ user: creds.user, pass: creds.pass }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new EllyBackendError(
      (data as { error?: string }).error ?? "Login al backend fallito",
    );
  }
  loggedIn = true;
}

async function ensureLogin(): Promise<void> {
  if (loggedIn) return;
  loginPromise ??= doLogin().finally(() => {
    loginPromise = null;
  });
  await loginPromise;
}

async function ellyGet<T>(path: string, retry = true): Promise<T> {
  if (!HAS_BACKEND) throw new BackendNotConfiguredError();
  await ensureLogin();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (res.status === 401 && retry) {
    loggedIn = false;
    return ellyGet<T>(path, false); // sessione scaduta: re-login e ritenta
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new EllyBackendError(
      (data as { error?: string })?.error ?? `HTTP ${res.status}`,
    );
  }
  return data as T;
}

function baseParam(base?: string): string {
  return base ? `&base=${encodeURIComponent(base)}` : "";
}

export const ellyApi = {
  // Garantisce la sessione backend (per il download materiali via fetch).
  ensureSession(): Promise<void> {
    if (!HAS_BACKEND) throw new BackendNotConfiguredError();
    return ensureLogin();
  },
  getCourses(): Promise<Course[]> {
    return ellyGet<Course[]>("/api/elly/courses");
  },
  // "base" e' l'istanza Elly del corso. Omesso, il backend ricade sull'anno
  // corrente: giusto per i corsi di quest'anno, sbagliato per gli arretrati.
  getContents(courseid: number | string, base?: string): Promise<Section[]> {
    return ellyGet<Section[]>(
      `/api/elly/contents?courseid=${courseid}${baseParam(base)}`,
    );
  },
  getFolder(url: string, base?: string): Promise<{ name: string; url: string }[]> {
    return ellyGet<{ name: string; url: string }[]>(
      `/api/elly/folder?url=${encodeURIComponent(url)}${baseParam(base)}`,
    );
  },
  // URL assoluto del proxy file server-side (apribile in browser/download).
  fileUrl(url: string, opts: { base?: string; modname?: string } = {}): string {
    return (
      `${API_BASE_URL}/api/elly/file?url=${encodeURIComponent(url)}` +
      baseParam(opts.base) +
      (opts.modname ? `&modname=${encodeURIComponent(opts.modname)}` : "")
    );
  },
};
