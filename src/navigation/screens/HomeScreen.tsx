import type { Libretto, RigaDaSostenere } from "@/src/api/unidesk/types";
import { getFloatingTabBarSpace } from "@/src/components/FloatingTabBar";
import { Screen, ScreenHeader } from "@/src/components/Screen";
import { EmptyView, ErrorView } from "@/src/components/StateViews";
import { Badge, Card, Segmented, Text } from "@/src/components/ui";
import {
  computeGradeDistribution,
  computeHistoryStats,
  computeSimulatedStats,
  computeTargetProjection,
  sortedHistory,
  type MockExam,
} from "@/src/containers/dashboard/stats";
import { StoriaView } from "@/src/containers/dashboard/StoriaView";
import { SimulatoreView } from "@/src/containers/dashboard/SimulatoreView";
import { LanguageSheet } from "@/src/containers/settings/LanguageSheet";
import { DaSostenereItem, SuperataItem } from "@/src/containers/esami/EsameItems";
import { useTranslation } from "@/src/hooks/useTranslation";
import { useAuthStore } from "@/src/stores/authStore";
import { useCareerStore } from "@/src/stores/careerStore";
import { theme } from "@/src/styles";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { Languages, LogOut } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ViewMode = "dashboard" | "storia" | "simulatore";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function ProgressTile({
  label,
  done,
  total,
  cfuLabel,
}: {
  label: string;
  done: number;
  total: number;
  cfuLabel: string;
}) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  return (
    <View style={[styles.statTile, styles.progressTile]}>
      <View style={styles.progressCounters}>
        <Text style={styles.progressLabel} numberOfLines={2}>
          {label}
        </Text>
        <Text style={styles.progressValue}>
          {done}/{total}
        </Text>
        <Text style={styles.progressCfu}>({cfuLabel})</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

export function HomeScreen() {
  const { t, language } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const languageSheetRef = useRef<BottomSheetModal>(null);

  const firstName = useAuthStore((s) => s.firstName);
  const logout = useAuthStore((s) => s.logout);

  const carriere = useCareerStore((s) => s.carriere);
  const selectedMatId = useCareerStore((s) => s.selectedMatId);
  const loadCareers = useCareerStore((s) => s.load);
  const setSelected = useCareerStore((s) => s.setSelected);

  const [libretto, setLibretto] = useState<Libretto | null>(null);
  const [daSostenere, setDaSostenere] = useState<RigaDaSostenere[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stato viste dashboard / storia / simulatore.
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(
    null,
  );
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [targetScore, setTargetScore] = useState(110);
  const [puntiInCorso, setPuntiInCorso] = useState(0);
  const [puntiTesi, setPuntiTesi] = useState(0);

  useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  const loadData = useCallback(async () => {
    if (selectedMatId == null) return;
    const client = useAuthStore.getState().getEsse3();
    if (!client) return;
    setError(null);
    try {
      const lib = await client.getLibretto(selectedMatId);
      setLibretto(lib);
      client
        .getDaSostenere(selectedMatId)
        .then(setDaSostenere)
        .catch(() => setDaSostenere(null));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [selectedMatId]);

  useEffect(() => {
    setLoading(true);
    setLibretto(null);
    setDaSostenere(null);
    setSelectedHistoryIndex(null);
    setMockExams([]);
    setViewMode("dashboard");
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCareers(true), loadData()]);
    setRefreshing(false);
  }, [loadCareers, loadData]);

  const goToEsame = (r: RigaDaSostenere) => {
    const k = r.chiaveADContestualizzata;
    navigation.navigate("EsameDetail", {
      adId: k.adId,
      matId: selectedMatId,
      cdsId: k.cdsId,
      adsceId: r.adsceId,
      stuId: r.stuId,
      nome: r.adDes,
    });
  };

  const stats = libretto?.stats;
  const superate = useMemo(() => libretto?.superate ?? [], [libretto]);

  const history = useMemo(() => sortedHistory(superate), [superate]);
  const historyStats = useMemo(() => computeHistoryStats(history), [history]);
  const simulatedStats = useMemo(
    () => computeSimulatedStats(superate, mockExams),
    [superate, mockExams],
  );
  const projection = useMemo(
    () =>
      computeTargetProjection(
        stats,
        targetScore,
        mockExams,
        simulatedStats.mediaPonderata,
        puntiInCorso + puntiTesi,
      ),
    [
      stats,
      targetScore,
      mockExams,
      simulatedStats.mediaPonderata,
      puntiInCorso,
      puntiTesi,
    ],
  );
  const gradeDistribution = useMemo(
    () => computeGradeDistribution(superate, mockExams),
    [superate, mockExams],
  );

  const dsRows: RigaDaSostenere[] = useMemo(
    () =>
      daSostenere ??
      (libretto?.daFare ?? []).map((r) => ({
        ...r,
        prenotazione: {
          stato: "nessuno",
          prenotabili: 0,
          dataPrenotazione: null,
          dataAppello: null,
        },
      })),
    [daSostenere, libretto],
  );

  const available = useMemo(
    () =>
      dsRows
        .filter((ds) => !mockExams.some((m) => m.adDes === ds.adDes))
        .map((ds) => ({ adDes: ds.adDes, peso: ds.peso })),
    [dsRows, mockExams],
  );

  // Statistiche mostrate nelle tile in base alla vista attiva.
  const totEsami = (stats?.esamiSuperati ?? 0) + (stats?.esamiDaFare ?? 0);
  const isHistoryActive =
    viewMode === "storia" && selectedHistoryIndex !== null;
  const currentStats =
    isHistoryActive && historyStats[selectedHistoryIndex]
      ? {
          media: historyStats[selectedHistoryIndex].mediaPonderata,
          voto: historyStats[selectedHistoryIndex].votoPartenza,
          cfu: historyStats[selectedHistoryIndex].cfuAcquisiti,
          esami: historyStats[selectedHistoryIndex].esamiSuperati,
        }
      : viewMode === "simulatore"
        ? {
            media: simulatedStats.mediaPonderata,
            voto: simulatedStats.votoPartenza,
            cfu: simulatedStats.cfuFatti,
            esami: simulatedStats.esamiSuperati,
          }
        : {
            media: stats?.mediaPonderata ?? 0,
            voto: stats?.mediaPonderata ? (stats.mediaPonderata / 30) * 110 : 0,
            cfu: stats?.cfuFatti ?? 0,
            esami: stats?.esamiSuperati ?? 0,
          };

  const sel = carriere.find((c) => c.matId === selectedMatId);
  const simulato =
    viewMode === "simulatore" && mockExams.length > 0
      ? ` (${t("simulato")})`
      : "";

  return (
    <Screen>
      <ScreenHeader
        title={firstName ? t("greeting", { name: firstName }) : t("nav_home")}
        subtitle={sel?.cdsDes}
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => languageSheetRef.current?.present()}
              hitSlop={10}
              activeOpacity={0.6}
              style={styles.langBtn}
            >
              <Languages size={18} color={theme.colors.gray500} />
              <Text style={styles.langCode}>{language.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={logout}
              hitSlop={10}
              activeOpacity={0.6}
              style={styles.logoutBtn}
            >
              <LogOut size={20} color={theme.colors.gray500} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getFloatingTabBarSpace(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {carriere.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.careerChips}
          >
            {carriere.map((c) => {
              const active = c.matId === selectedMatId;
              return (
                <TouchableOpacity
                  key={c.matId}
                  onPress={() => setSelected(c.matId)}
                  activeOpacity={0.6}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {c.cdsDes}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {error ? (
          <ErrorView title={t("esse3_error")} message={error} />
        ) : loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <Segmented<ViewMode>
              options={[
                { label: t("view_dashboard"), value: "dashboard" },
                { label: t("view_storia"), value: "storia" },
                { label: t("view_simulatore"), value: "simulatore" },
              ]}
              value={viewMode}
              onChange={(v) => {
                setViewMode(v);
                if (v !== "storia") setSelectedHistoryIndex(null);
              }}
            />

            <View style={styles.statsGrid}>
              <StatTile
                label={t("media_ponderata") + simulato}
                value={currentStats.media.toFixed(2)}
              />
              <StatTile
                label={t("voto_partenza") + simulato}
                value={currentStats.voto.toFixed(2)}
              />
              <ProgressTile
                label={t("esami_superati") + simulato}
                done={currentStats.esami}
                total={totEsami}
                cfuLabel={t("cfu_n", { n: currentStats.cfu })}
              />
            </View>

            {viewMode === "storia" ? (
              <StoriaView
                historyStats={historyStats}
                selectedIndex={selectedHistoryIndex}
                onSelect={setSelectedHistoryIndex}
              />
            ) : viewMode === "simulatore" ? (
              <SimulatoreView
                available={available}
                mockExams={mockExams}
                onAdd={(m) => setMockExams((prev) => [...prev, m])}
                onRemove={(id) =>
                  setMockExams((prev) => prev.filter((m) => m.id !== id))
                }
                targetScore={targetScore}
                onTargetChange={setTargetScore}
                puntiInCorso={puntiInCorso}
                onPuntiInCorsoChange={setPuntiInCorso}
                puntiTesi={puntiTesi}
                onPuntiTesiChange={setPuntiTesi}
                projection={projection}
                gradeDistribution={gradeDistribution}
              />
            ) : (
              <>
                <Card
                  title={t("da_sostenere")}
                  right={<Badge label={String(dsRows.length)} tone="primary" />}
                >
                  {dsRows.length === 0 ? (
                    <EmptyView message={t("nessun_esame_da_sostenere")} />
                  ) : (
                    dsRows.map((r) => (
                      <DaSostenereItem
                        key={r.chiaveADContestualizzata.adId}
                        riga={r}
                        onPress={() => goToEsame(r)}
                      />
                    ))
                  )}
                </Card>

                <Card
                  title={t("esami_superati")}
                  right={
                    <Badge
                      label={String(superate.length)}
                      tone="success"
                    />
                  }
                >
                  {superate.length === 0 ? (
                    <EmptyView message={t("nessun_esame_superato")} />
                  ) : (
                    superate.map((r) => (
                      <SuperataItem
                        key={r.chiaveADContestualizzata.adId}
                        riga={r}
                      />
                    ))
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>

      <LanguageSheet ref={languageSheetRef} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray100,
  },
  langCode: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.gray600,
  },
  logoutBtn: {
    padding: theme.spacing.xs,
  },
  careerChips: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    maxWidth: 240,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: theme.colors.gray600,
  },
  chipTextActive: {
    color: theme.colors.white,
    fontWeight: "500",
  },
  loadingBox: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.gray100,
    padding: theme.spacing.md,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
  progressTile: {
    flexBasis: "100%",
    gap: theme.spacing.sm,
  },
  progressCounters: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  progressLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.gray800,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  progressCfu: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.gray600,
  },
  progressTrack: {
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray100,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
  },
});
