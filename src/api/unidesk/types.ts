// Tipi di dominio Unidesk (Esse3 + Elly), allineati a @unidesk/core.

// ─── Esse3 ────────────────────────────────────────────────────────────────────

export interface TrattoCarriera {
  matId: number;
  matricola: string;
  cdsDes: string;
  staStuCod: string; // "A" = attivo, "X" = cessato
  staStuDes: string;
  dettaglioTratto: { annoCorso: number; cdsId: number; tipoCorsoCod: string };
}

export interface LoginResp {
  user: {
    firstName: string;
    lastName: string;
    trattiCarriera: TrattoCarriera[];
  };
}

export interface RigaLibretto {
  adDes: string;
  peso: number; // CFU
  tipoInsDes: string; // Obbligatorio / Opzionale
  stato: { value: string }; // "S" superata, "F" frequentata
  esito: {
    voto: number | null;
    dataEsa: string;
    lode?: boolean;
    dataVerb?: string;
    dataPubb?: string;
  };
  numAppelliPrenotabili: number;
  numPrenotazioni: number;
  adsceId: number; // id AD-scelta dello studente, serve per la prenotazione
  stuId: number; // id studente, serve per la disiscrizione
  chiaveADContestualizzata: { adId: number; afId: number; cdsId: number };
  dataIns?: string; // data inserimento a libretto
}

export interface LibrettoStats {
  esamiSuperati: number;
  cfuFatti: number;
  mediaPonderata: number;
  esamiDaFare: number;
  cfuRimasti: number;
}

export interface Libretto {
  righe: RigaLibretto[];
  superate: RigaLibretto[];
  daFare: RigaLibretto[];
  stats: LibrettoStats;
}

export interface Appello {
  appId: number;
  adId: number;
  cdsId: number;
  desApp: string;
  dataInizioApp: string; // data dell'esame
  dataInizioIscr: string; // apertura iscrizioni
  dataFineIscr: string; // chiusura iscrizioni
  numIscritti: number;
  note: string | null;
  stato: string; // "P" = Prenotazioni Aperte
}

export interface Presa {
  appId: number;
  adId: number;
  cdsId: number;
  dataIns: string;
  dataEsa: string | null;
}

export interface PrenotazioneInfo {
  stato: "prenotato" | "prenotabile" | "esterno" | "nessuno";
  prenotabili: number;
  dataPrenotazione: string | null;
  dataAppello: string | null;
}

export interface RigaDaSostenere extends RigaLibretto {
  prenotazione: PrenotazioneInfo;
}

export interface AppelloConStato extends Appello {
  prenotato: boolean;
  prenotabile: boolean;
  disiscrivibile: boolean;
  iscrizioni: "futura" | "aperta" | "chiusa";
}

// ─── Elly ─────────────────────────────────────────────────────────────────────

export interface Course {
  id: number;
  shortname: string;
  fullname: string;
  viewurl?: string;
  courseimage?: string;
  progress?: number | null;
  hidden?: boolean;
}

export interface Module {
  id: number;
  name: string;
  modname: string; // resource, url, folder, forum, assign, ...
  url?: string;
}

export interface Section {
  id: number;
  name: string;
  section: number;
  modules: Module[];
}
