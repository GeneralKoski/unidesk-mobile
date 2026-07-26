import { Card, Text } from "@/src/components/ui";
import { DfButton } from "@/src/components/form/DfButton";
import { GradeHistogram } from "@/src/containers/dashboard/GradeHistogram";
import type {
  GradeDistribution,
  MockExam,
  TargetProjection,
} from "@/src/containers/dashboard/stats";
import { useTranslation } from "@/src/hooks/useTranslation";
import { theme } from "@/src/styles";
import { hexToRgba } from "@/src/utils/utils";
import { Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export interface AvailableExam {
  adDes: string;
  peso: number;
}

const VOTI = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const TARGETS = Array.from({ length: 45 }, (_, i) => 110 - i); // 110..66
const PUNTI_IN_CORSO = [0, 1, 2, 3];
const PUNTI_TESI = [0, 1, 2, 3, 4, 5, 6, 7];

function NumberChips({
  values,
  value,
  onChange,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {values.map((v) => {
        const active = value === v;
        return (
          <TouchableOpacity
            key={v}
            onPress={() => onChange(v)}
            activeOpacity={0.6}
            style={[styles.votoChip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {v}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function SimulatoreView({
  available,
  mockExams,
  onAdd,
  onRemove,
  targetScore,
  onTargetChange,
  puntiInCorso,
  onPuntiInCorsoChange,
  puntiTesi,
  onPuntiTesiChange,
  projection,
  gradeDistribution,
}: {
  available: AvailableExam[];
  mockExams: MockExam[];
  onAdd: (exam: MockExam) => void;
  onRemove: (id: string) => void;
  targetScore: number;
  onTargetChange: (score: number) => void;
  puntiInCorso: number;
  onPuntiInCorsoChange: (p: number) => void;
  puntiTesi: number;
  onPuntiTesiChange: (p: number) => void;
  projection: TargetProjection | null;
  gradeDistribution: GradeDistribution;
}) {
  const { t } = useTranslation();
  const [sel, setSel] = useState<AvailableExam | null>(null);
  const [voto, setVoto] = useState<number | null>(30);
  const [lode, setLode] = useState(false);

  const add = () => {
    if (!sel) return;
    onAdd({
      id: `${sel.adDes}-${mockExams.length}-${sel.peso}`,
      adDes: sel.adDes,
      peso: sel.peso,
      voto,
      lode: voto === 30 && lode,
    });
    setSel(null);
    setVoto(30);
    setLode(false);
  };

  return (
    <>
      <Card title={t("simulatore_titolo")}>
        <Text style={styles.hint}>{t("simulatore_hint")}</Text>

        <Text style={styles.fieldLabel}>{t("scegli_esame")}</Text>
        {available.length === 0 ? (
          <Text style={styles.meta}>{t("nessun_esame_da_simulare")}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {available.map((e) => {
              const active = sel?.adDes === e.adDes;
              return (
                <TouchableOpacity
                  key={e.adDes}
                  onPress={() => setSel(e)}
                  activeOpacity={0.6}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {e.adDes} ({e.peso})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.fieldLabel}>{t("voto_label")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {VOTI.map((v) => {
            const active = voto === v;
            return (
              <TouchableOpacity
                key={v}
                onPress={() => {
                  setVoto(v);
                  if (v !== 30) setLode(false);
                }}
                activeOpacity={0.6}
                style={[styles.votoChip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => {
              setVoto(null);
              setLode(false);
            }}
            activeOpacity={0.6}
            style={[styles.votoChip, voto === null && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, voto === null && styles.chipTextActive]}
            >
              {t("idoneo")}
            </Text>
          </TouchableOpacity>
          {voto === 30 ? (
            <TouchableOpacity
              onPress={() => setLode((l) => !l)}
              activeOpacity={0.6}
              style={[styles.votoChip, lode && styles.chipActive]}
            >
              <Text style={[styles.chipText, lode && styles.chipTextActive]}>
                {t("lode")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <View style={styles.addBtn}>
          <DfButton
            label={t("aggiungi_esame")}
            color={theme.colors.primary}
            disabled={!sel}
            onPress={add}
          />
        </View>

        {mockExams.length > 0 ? (
          <View style={styles.mockList}>
            {mockExams.map((m) => (
              <View key={m.id} style={styles.mockRow}>
                <View style={styles.mockMain}>
                  <Text style={styles.mockName} numberOfLines={1}>
                    {m.adDes}
                  </Text>
                  <Text style={styles.meta}>
                    {m.peso} CFU •{" "}
                    {m.voto != null
                      ? `${m.voto}${m.lode ? " e lode" : ""}`
                      : t("idoneo")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onRemove(m.id)}
                  hitSlop={8}
                  activeOpacity={0.6}
                >
                  <Trash2 size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Card title={t("proiezioni_laurea")}>
        <Text style={styles.fieldLabel}>{t("voto_laurea_desiderato")}</Text>
        <NumberChips
          values={TARGETS}
          value={targetScore}
          onChange={onTargetChange}
        />

        <Text style={styles.fieldLabel}>{t("punti_laurea_in_corso")}</Text>
        <NumberChips
          values={PUNTI_IN_CORSO}
          value={puntiInCorso}
          onChange={onPuntiInCorsoChange}
        />

        <Text style={styles.fieldLabel}>{t("punti_tesi")}</Text>
        <NumberChips
          values={PUNTI_TESI}
          value={puntiTesi}
          onChange={onPuntiTesiChange}
        />

        {projection ? (
          <View
            style={[
              styles.projBox,
              {
                backgroundColor: hexToRgba(
                  projection.achievable
                    ? theme.colors.success
                    : theme.colors.warning,
                  0.1,
                ),
              },
            ]}
          >
            <Text style={styles.projText}>{projection.message}</Text>
            <Text style={styles.projVoto}>
              {t("voto_laurea_previsto")}: {projection.votoPrevisto}
            </Text>
          </View>
        ) : (
          <Text style={styles.meta}>{t("proiezione_non_disponibile")}</Text>
        )}
      </Card>

      <Card title={t("distribuzione_voti")}>
        <GradeHistogram
          distribution={gradeDistribution}
          emptyLabel={t("nessun_voto_distribuzione")}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.gray700,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.gray500,
  },
  chipRow: {
    gap: theme.spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    maxWidth: 220,
  },
  votoChip: {
    minWidth: 44,
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: theme.colors.gray700,
  },
  chipTextActive: {
    color: theme.colors.white,
    fontWeight: "500",
  },
  addBtn: {
    marginTop: theme.spacing.md,
  },
  mockList: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  mockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.gray100,
  },
  mockMain: {
    flex: 1,
    gap: 2,
  },
  mockName: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.gray900,
  },
  projBox: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  projText: {
    fontSize: 14,
    color: theme.colors.gray800,
  },
  projVoto: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.gray900,
    marginTop: theme.spacing.xs,
  },
});
