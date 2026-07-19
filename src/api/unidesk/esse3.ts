import { ESSE3_BASE } from "@/src/consts";
import type {
  Appello,
  AppelloConStato,
  Libretto,
  LibrettoStats,
  LoginResp,
  Presa,
  RigaDaSostenere,
  RigaLibretto,
  TrattoCarriera,
} from "./types";

// Base64 encoder senza dipendenza da Buffer/btoa (non garantiti su tutti i
// runtime RN). Sufficiente per l'header Basic (credenziali ASCII).
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function base64(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i += 3) {
    const c1 = input.charCodeAt(i);
    const c2 = i + 1 < input.length ? input.charCodeAt(i + 1) : NaN;
    const c3 = i + 2 < input.length ? input.charCodeAt(i + 2) : NaN;
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const e3 = isNaN(c2) ? "=" : B64[((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6)];
    const e4 = isNaN(c3) ? "=" : B64[c3 & 63];
    out += B64[e1] + B64[e2] + e3 + e4;
  }
  return out;
}

// Le date calesa arrivano come "dd/MM/yyyy": non ISO, Date.parse fallisce.
function parseEsse3Date(s: string | undefined): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s ?? "");
  return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : null;
}

function startOfTodayUTC(): number {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

// e3rest accetta Basic Auth a ogni chiamata (stateless): l'header Authorization
// viene ricalcolato dal client, nessuna sessione da gestire.
export class Esse3Client {
  private readonly auth: string;
  private readonly base: string;

  constructor(user: string, pass: string, base: string = ESSE3_BASE) {
    this.auth = "Basic " + base64(`${user}:${pass}`);
    this.base = base;
  }

  private async api<T>(
    path: string,
    init?: { method?: string; body?: unknown },
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: this.auth,
      Accept: "application/json",
    };
    if (init?.body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(`${this.base}${path}`, {
      method: init?.method ?? "GET",
      headers,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = JSON.parse(text);
        msg = j?.retErrMsg ?? j?.errDetails?.[0]?.errorType ?? msg;
      } catch {
        /* corpo non JSON */
      }
      throw new Error(msg);
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  login(): Promise<LoginResp> {
    return this.api<LoginResp>("/login");
  }

  async getCarriere(): Promise<TrattoCarriera[]> {
    const { user } = await this.login();
    return user.trattiCarriera;
  }

  async getActiveCareer(): Promise<TrattoCarriera> {
    const carriere = await this.getCarriere();
    const attiva = carriere.find((t) => t.staStuCod === "A");
    if (!attiva) throw new Error("Nessuna carriera attiva trovata.");
    return attiva;
  }

  // Le versioni dei service cambiano da ateneo ad ateneo: prova v2, ripiega v1.
  async getLibrettoRighe(matId: number): Promise<RigaLibretto[]> {
    for (const v of ["v2", "v1"] as const) {
      try {
        return await this.api<RigaLibretto[]>(
          `/libretto-service-${v}/libretti/${matId}/righe`,
        );
      } catch (err) {
        if (v === "v1") throw err;
      }
    }
    return [];
  }

  async getLibretto(matId: number): Promise<Libretto> {
    const righe = await this.getLibrettoRighe(matId);

    // La lode è un flag a parte nell'esito; il nome varia tra atenei CINECA.
    for (const r of righe) {
      const e = r.esito as Record<string, unknown>;
      const flag = e.lodeFlg ?? e.lode ?? e.votoLode ?? e.lodeFl;
      r.esito.lode =
        flag === true ||
        flag === 1 ||
        flag === "1" ||
        flag === "S" ||
        flag === "L";
    }
    const superate = righe.filter((r) => r.stato.value === "S");
    const daFare = righe.filter((r) => r.stato.value !== "S");

    const cfuFatti = superate.reduce((s, r) => s + r.peso, 0);
    const conVoto = superate.filter((r) => r.esito.voto != null);
    const sommaPesata = conVoto.reduce(
      (s, r) => s + (r.esito.voto as number) * r.peso,
      0,
    );
    const pesoTot = conVoto.reduce((s, r) => s + r.peso, 0);

    const stats: LibrettoStats = {
      esamiSuperati: superate.length,
      cfuFatti,
      mediaPonderata: pesoTot ? sommaPesata / pesoTot : 0,
      esamiDaFare: daFare.length,
      cfuRimasti: daFare.reduce((s, r) => s + r.peso, 0),
    };

    return { righe, superate, daFare, stats };
  }

  // --- calesa: appelli e prenotazioni ---
  getAppelli(cdsId: number, adId: number): Promise<Appello[]> {
    return this.api<Appello[]>(`/calesa-service-v1/appelli/${cdsId}/${adId}`);
  }

  getPrenotazioni(matId: number): Promise<Presa[]> {
    return this.api<Presa[]>(`/calesa-service-v1/prenotazioni/${matId}`);
  }

  async getAppelliConStato(
    matId: number,
    cdsId: number,
    adId: number,
  ): Promise<AppelloConStato[]> {
    const [appelli, prese] = await Promise.all([
      this.getAppelli(cdsId, adId),
      this.getPrenotazioni(matId).catch(() => [] as Presa[]),
    ]);
    const iscritto = new Set(
      prese.filter((p) => p.adId === adId).map((p) => p.appId),
    );
    const oggi = startOfTodayUTC();
    return appelli
      .filter((a) => {
        const esame = parseEsse3Date(a.dataInizioApp);
        return esame !== null && esame >= oggi;
      })
      .sort(
        (a, b) =>
          (parseEsse3Date(a.dataInizioApp) ?? 0) -
          (parseEsse3Date(b.dataInizioApp) ?? 0),
      )
      .map((a) => {
        const prenotabile = a.stato === "P";
        const apertura = parseEsse3Date(a.dataInizioIscr);
        const iscrizioni: AppelloConStato["iscrizioni"] = prenotabile
          ? "aperta"
          : apertura !== null && oggi < apertura
            ? "futura"
            : "chiusa";
        return {
          ...a,
          prenotato: iscritto.has(a.appId),
          prenotabile,
          disiscrivibile: prenotabile,
          iscrizioni,
        };
      });
  }

  async getDaSostenere(matId: number): Promise<RigaDaSostenere[]> {
    const [{ daFare }, prese] = await Promise.all([
      this.getLibretto(matId),
      this.getPrenotazioni(matId).catch(() => [] as Presa[]),
    ]);
    const presaByAd = new Map(prese.map((p) => [p.adId, p]));

    return Promise.all(
      daFare.map(async (r): Promise<RigaDaSostenere> => {
        const { adId, cdsId } = r.chiaveADContestualizzata;
        const presa = presaByAd.get(adId);

        if (r.numPrenotazioni > 0 && presa) {
          const appelli = await this.getAppelli(cdsId, adId).catch(
            () => [] as Appello[],
          );
          const appello = appelli.find((a) => a.appId === presa.appId);
          return {
            ...r,
            prenotazione: {
              stato: "prenotato",
              prenotabili: 0,
              dataPrenotazione: presa.dataIns,
              dataAppello: appello?.dataInizioApp ?? presa.dataEsa,
            },
          };
        }

        if (r.numAppelliPrenotabili > 0) {
          let appelli: Appello[] | null = null;
          try {
            appelli = await this.getAppelli(cdsId, adId);
          } catch {
            appelli = null;
          }
          if (appelli === null) {
            return {
              ...r,
              prenotazione: {
                stato: "esterno",
                prenotabili: r.numAppelliPrenotabili,
                dataPrenotazione: null,
                dataAppello: null,
              },
            };
          }
          const aperti = appelli
            .filter((a) => a.stato === "P")
            .sort(
              (a, b) =>
                (parseEsse3Date(a.dataInizioApp) ?? Infinity) -
                (parseEsse3Date(b.dataInizioApp) ?? Infinity),
            );
          return {
            ...r,
            prenotazione: {
              stato: aperti.length > 0 ? "prenotabile" : "nessuno",
              prenotabili: aperti.length,
              dataPrenotazione: null,
              dataAppello: aperti[0]?.dataInizioApp ?? null,
            },
          };
        }

        return {
          ...r,
          prenotazione: {
            stato: "nessuno",
            prenotabili: 0,
            dataPrenotazione: null,
            dataAppello: null,
          },
        };
      }),
    );
  }

  // SCRITTURA - richiede conferma esplicita lato chiamante.
  prenota(
    cdsId: number,
    adId: number,
    appId: number,
    adsceId: number,
  ): Promise<unknown> {
    return this.api(
      `/calesa-service-v1/appelli/${cdsId}/${adId}/${appId}/iscritti`,
      { method: "POST", body: { adsceId } },
    );
  }

  // SCRITTURA - richiede conferma esplicita lato chiamante.
  disiscrivi(
    cdsId: number,
    adId: number,
    appId: number,
    stuId: number,
  ): Promise<unknown> {
    return this.api(
      `/calesa-service-v1/appelli/${cdsId}/${adId}/${appId}/iscritti/${stuId}`,
      { method: "DELETE" },
    );
  }
}
