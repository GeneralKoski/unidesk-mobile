import type { LibrettoStats, RigaLibretto } from "@/src/api/unidesk/types";

// Calcoli della dashboard (storia media, simulatore, proiezioni laurea),
// portati 1:1 dalla web app. Funzioni pure: nessuna dipendenza da React.

export type SortBy = "dataRicezione" | "dataEsa";

export interface MockExam {
  id: string;
  adDes: string;
  peso: number;
  voto: number | null;
  lode: boolean;
}

export interface HistoryStat {
  exam: RigaLibretto;
  date: string;
  mediaPonderata: number;
  votoPartenza: number;
  cfuAcquisiti: number;
  esamiSuperati: number;
  impattoMedia: number;
}

export interface SimulatedStats {
  cfuFatti: number;
  mediaPonderata: number;
  votoPartenza: number;
  esamiSuperati: number;
}

export interface TargetProjection {
  achievable: boolean;
  neededAvg?: number;
  message: string;
}

export interface GradeDistribution {
  data: { grade: string; count: number }[];
  maxCount: number;
}

function getExamDate(r: RigaLibretto, type: SortBy): string {
  if (type === "dataRicezione") {
    return (
      r.esito.dataVerb || r.dataIns || r.esito.dataPubb || r.esito.dataEsa || ""
    );
  }
  return r.esito.dataEsa || "";
}

function parseDateString(dStr: string | undefined): number {
  if (!dStr) return 0;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(dStr);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
  const parsed = Date.parse(dStr);
  return isNaN(parsed) ? 0 : parsed;
}

export function sortedHistory(
  superate: RigaLibretto[],
  sortBy: SortBy,
): RigaLibretto[] {
  return [...superate].sort((a, b) => {
    const da = parseDateString(getExamDate(a, sortBy));
    const db = parseDateString(getExamDate(b, sortBy));
    if (da !== db) return da - db;
    return a.adDes.localeCompare(b.adDes);
  });
}

export function computeHistoryStats(
  history: RigaLibretto[],
  sortBy: SortBy,
): HistoryStat[] {
  const list: HistoryStat[] = [];
  let totalVotiPesati = 0;
  let totalCFUConVoto = 0;
  let totalCFU = 0;

  for (let i = 0; i < history.length; i++) {
    const exam = history[i];
    totalCFU += exam.peso;

    const haVoto = exam.esito.voto != null;
    if (haVoto) {
      totalVotiPesati += (exam.esito.voto as number) * exam.peso;
      totalCFUConVoto += exam.peso;
    }

    const mediaPonderata =
      totalCFUConVoto > 0 ? totalVotiPesati / totalCFUConVoto : 0;
    const votoPartenza = (mediaPonderata / 30) * 110;
    const impattoMedia =
      i > 0 && haVoto && list[i - 1].mediaPonderata > 0
        ? mediaPonderata - list[i - 1].mediaPonderata
        : 0;

    list.push({
      exam,
      date: getExamDate(exam, sortBy)?.slice(0, 10) || "N/D",
      mediaPonderata,
      votoPartenza,
      cfuAcquisiti: totalCFU,
      esamiSuperati: i + 1,
      impattoMedia,
    });
  }
  return list;
}

export function computeSimulatedStats(
  superate: RigaLibretto[],
  mockExams: MockExam[],
): SimulatedStats {
  const tutti = [
    ...superate.map((r) => ({
      peso: r.peso,
      voto: r.esito.voto,
      lode: r.esito.lode,
    })),
    ...mockExams.map((m) => ({ peso: m.peso, voto: m.voto, lode: m.lode })),
  ];

  const cfuFatti = tutti.reduce((s, r) => s + r.peso, 0);
  const conVoto = tutti.filter((r) => r.voto != null);
  const sommaPesata = conVoto.reduce(
    (s, r) => s + (r.voto as number) * r.peso,
    0,
  );
  const pesoTot = conVoto.reduce((s, r) => s + r.peso, 0);
  const mediaPonderata = pesoTot ? sommaPesata / pesoTot : 0;

  return {
    cfuFatti,
    mediaPonderata,
    votoPartenza: (mediaPonderata / 30) * 110,
    esamiSuperati: tutti.length,
  };
}

export function computeTargetProjection(
  stats: LibrettoStats | undefined,
  targetScore: number,
  mockExams: MockExam[],
  simulatedMedia: number,
): TargetProjection | null {
  if (!stats) return null;

  const realCfu = stats.cfuFatti;
  const remainingCfu = stats.cfuRimasti;
  const mockCfu = mockExams.reduce((s, r) => s + r.peso, 0);

  const effectiveRemainingCfu = Math.max(0, remainingCfu - mockCfu);
  const effectiveRealCfu = realCfu + mockCfu;
  const effectiveRealMedia = simulatedMedia;

  if (effectiveRemainingCfu <= 0) {
    return {
      achievable: true,
      message:
        "Obiettivo raggiunto: hai simulato il completamento di tutti i CFU rimanenti.",
    };
  }

  const targetAvg = (targetScore * 30) / 110;
  const totalCfu = effectiveRealCfu + effectiveRemainingCfu;
  const neededAvg =
    (targetAvg * totalCfu - effectiveRealMedia * effectiveRealCfu) /
    effectiveRemainingCfu;

  if (neededAvg <= 18) {
    return {
      achievable: true,
      neededAvg,
      message: `Obiettivo garantito: ti basta una media di 18,00 (o idoneità) nei restanti ${effectiveRemainingCfu} CFU.`,
    };
  }
  if (neededAvg > 30) {
    return {
      achievable: false,
      neededAvg,
      message: `Non raggiungibile: richiederebbe una media di ${neededAvg.toFixed(2)} nei restanti ${effectiveRemainingCfu} CFU.`,
    };
  }
  return {
    achievable: true,
    neededAvg,
    message: `Raggiungibile con una media di ${neededAvg.toFixed(2)} nei restanti ${effectiveRemainingCfu} CFU.`,
  };
}

export function computeGradeDistribution(
  superate: RigaLibretto[],
): GradeDistribution {
  const distribution: Record<string, number> = {};
  for (let g = 18; g <= 30; g++) distribution[String(g)] = 0;
  distribution["30L"] = 0;

  let maxCount = 0;
  for (const r of superate) {
    if (r.esito.voto == null) continue;
    const key = r.esito.voto === 30 && r.esito.lode ? "30L" : String(r.esito.voto);
    distribution[key] = (distribution[key] || 0) + 1;
    if (distribution[key] > maxCount) maxCount = distribution[key];
  }

  return {
    data: Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
    })),
    maxCount,
  };
}
