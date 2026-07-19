import type { RigaDaSostenere, RigaLibretto } from "@/src/api/unidesk/types";
import { Badge, type BadgeTone, Text } from "@/src/components/ui";
import { useTranslation } from "@/src/hooks/useTranslation";
import { theme } from "@/src/styles";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export const fmtDate = (d: string | null | undefined) =>
  d ? d.slice(0, 10) : "-";

export function TipoBadge({ tipo }: { tipo: string }) {
  const { t } = useTranslation();
  return /opzion/i.test(tipo) ? (
    <Badge label={t("tipo_scelta")} tone="purple" />
  ) : (
    <Badge label={t("tipo_obbligatorio")} tone="neutral" />
  );
}

function prenotazioneBadge(r: RigaDaSostenere, t: (k: string, o?: Record<string, unknown>) => string) {
  if (r.numPrenotazioni > 0)
    return { label: t("stato_prenotato"), tone: "primary" as BadgeTone };
  if (r.prenotazione?.stato === "esterno")
    return { label: t("stato_su_esse3"), tone: "warning" as BadgeTone };
  if ((r.prenotazione?.prenotabili ?? 0) > 0)
    return {
      label: t("stato_prenotabili", { n: r.prenotazione.prenotabili }),
      tone: "warning" as BadgeTone,
    };
  return { label: t("stato_nessun_appello"), tone: "neutral" as BadgeTone };
}

export function DaSostenereItem({
  riga,
  onPress,
  card = false,
}: {
  riga: RigaDaSostenere;
  onPress: () => void;
  card?: boolean;
}) {
  const { t } = useTranslation();
  const badge = prenotazioneBadge(riga, t);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={[styles.row, card && styles.cardRow]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.name} numberOfLines={2}>
          {riga.adDes}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{t("cfu_n", { n: riga.peso })}</Text>
          <TipoBadge tipo={riga.tipoInsDes} />
          <Badge label={badge.label} tone={badge.tone} />
          {riga.prenotazione?.dataAppello ? (
            <Text style={styles.meta}>
              {fmtDate(riga.prenotazione.dataAppello)}
            </Text>
          ) : null}
        </View>
      </View>
      <ChevronRight size={20} color={theme.colors.gray400} />
    </TouchableOpacity>
  );
}

export function SuperataItem({ riga }: { riga: RigaLibretto }) {
  const { t } = useTranslation();
  const voto =
    riga.esito.voto != null
      ? `${riga.esito.voto}${riga.esito.lode ? "L" : ""}`
      : t("idoneo");
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.name} numberOfLines={2}>
          {riga.adDes}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{t("cfu_n", { n: riga.peso })}</Text>
          <TipoBadge tipo={riga.tipoInsDes} />
          <Text style={styles.meta}>{fmtDate(riga.esito.dataEsa)}</Text>
        </View>
      </View>
      <Badge label={voto} tone="success" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray100,
  },
  cardRow: {
    borderBottomWidth: 0,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray100,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.gray900,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.gray500,
  },
});
