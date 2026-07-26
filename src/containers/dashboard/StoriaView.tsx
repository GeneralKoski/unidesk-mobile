import { Badge, Card, Text } from "@/src/components/ui";
import { MediaChart } from "@/src/containers/dashboard/MediaChart";
import type { HistoryStat } from "@/src/containers/dashboard/stats";
import { useTranslation } from "@/src/hooks/useTranslation";
import { theme } from "@/src/styles";
import { ArrowDown, ArrowUp, Minus } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

function votoLabel(stat: HistoryStat, idoneo: string): string {
  const v = stat.exam.esito.voto;
  return v != null ? `${v}${stat.exam.esito.lode ? "L" : ""}` : idoneo;
}

function votoTone(voto: number | null): "success" | "primary" | "warning" | "purple" {
  if (voto == null) return "purple";
  if (voto >= 28) return "success";
  if (voto >= 24) return "primary";
  return "warning";
}

export function StoriaView({
  historyStats,
  selectedIndex,
  onSelect,
}: {
  historyStats: HistoryStat[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}) {
  const { t } = useTranslation();

  if (historyStats.length === 0) {
    return (
      <Card title={t("storia_titolo")}>
        <Text style={styles.empty}>{t("nessun_esame_superato")}</Text>
      </Card>
    );
  }

  const selected =
    selectedIndex !== null ? historyStats[selectedIndex] : null;

  return (
    <>
      <Card title={t("andamento_media")}>
        <MediaChart
          history={historyStats}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          emptyLabel={t("dati_insufficienti_grafico")}
        />
      </Card>

      {selected ? (
        <Card title={selected.exam.adDes}>
          <View style={styles.detailGrid}>
            <Detail label={t("voto_label")} value={votoLabel(selected, t("idoneo"))} />
            <Detail label={t("cfu_label")} value={String(selected.exam.peso)} />
            <Detail
              label={t("nuova_media")}
              value={selected.mediaPonderata.toFixed(2)}
            />
            <ImpactDetail
              label={t("impatto_media")}
              value={selected.impattoMedia}
              hasImpact={
                selected.exam.esito.voto != null &&
                (selectedIndex ?? 0) > 0
              }
              na={t("na")}
            />
          </View>
          <TouchableOpacity onPress={() => onSelect(null)} activeOpacity={0.6}>
            <Text style={styles.reset}>{t("torna_attuale")}</Text>
          </TouchableOpacity>
        </Card>
      ) : null}

      <Card title={t("timeline_titolo")}>
        {historyStats
          .map((item, idx) => ({ item, idx }))
          .reverse()
          .map(({ item, idx }) => {
            const isSelected = selectedIndex === idx;
            const tone = votoTone(item.exam.esito.voto);
            return (
              <TouchableOpacity
                key={item.exam.chiaveADContestualizzata.adId}
                onPress={() => onSelect(idx)}
                activeOpacity={0.6}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowName} numberOfLines={2}>
                    {item.exam.adDes}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {item.exam.peso} CFU • {item.date}
                  </Text>
                </View>
                <Badge label={votoLabel(item, t("idoneo"))} tone={tone} />
              </TouchableOpacity>
            );
          })}
      </Card>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailTile}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ImpactDetail({
  label,
  value,
  hasImpact,
  na,
}: {
  label: string;
  value: number;
  hasImpact: boolean;
  na: string;
}) {
  const color =
    !hasImpact || value === 0
      ? theme.colors.gray500
      : value > 0
        ? theme.colors.success
        : theme.colors.error;
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <View style={styles.detailTile}>
      <Text style={styles.detailLabel}>{label}</Text>
      {hasImpact ? (
        <View style={styles.impactRow}>
          <Icon size={14} color={color} />
          <Text style={[styles.detailValue, { color }]}>
            {value > 0 ? "+" : ""}
            {value.toFixed(2)}
          </Text>
        </View>
      ) : (
        <Text style={styles.detailValue}>{na}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    color: theme.colors.gray500,
    textAlign: "center",
    paddingVertical: theme.spacing.sm,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  detailTile: {
    flexGrow: 1,
    flexBasis: "45%",
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.gray900,
  },
  impactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reset: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "500",
    marginTop: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray100,
  },
  rowSelected: {
    backgroundColor: "#f0f5ff",
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.gray900,
  },
  rowMeta: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
});
