import type { AppelloConStato } from "@/src/api/unidesk/types";
import type { EsameDetailParams } from "@/src/navigation";
import { DfButton } from "@/src/components/form/DfButton";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { Badge, Card, Text } from "@/src/components/ui";
import { fmtDate } from "@/src/containers/esami/EsameItems";
import { useTranslation } from "@/src/hooks/useTranslation";
import { useAuthStore } from "@/src/stores/authStore";
import { ESSE3_WEB_BASE } from "@/src/consts";
import { theme } from "@/src/styles";
import { showToast } from "@/src/utils/toast";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OPIS_URL = `${ESSE3_WEB_BASE}/auth/studente/Appelli/AppelliF.do`;

function AppelloCard({
  appello,
  busy,
  onPrenota,
  onDisiscrivi,
}: {
  appello: AppelloConStato;
  busy: boolean;
  onPrenota: () => void;
  onDisiscrivi: () => void;
}) {
  const { t } = useTranslation();

  const azione = () => {
    if (appello.prenotato) {
      return appello.disiscrivibile ? (
        <DfButton
          label={t("disiscriviti")}
          variant="outlined"
          color={theme.colors.error}
          loading={busy}
          onPress={onDisiscrivi}
        />
      ) : (
        <Badge label={t("disiscrizione_chiusa")} tone="neutral" />
      );
    }
    if (appello.prenotabile) {
      return (
        <DfButton
          label={t("prenota")}
          color={theme.colors.primary}
          loading={busy}
          onPress={onPrenota}
        />
      );
    }
    if (appello.iscrizioni === "futura") {
      return (
        <Badge
          label={t("apre_il", { data: fmtDate(appello.dataInizioIscr) })}
          tone="neutral"
        />
      );
    }
    return <Badge label={t("prenotazioni_chiuse")} tone="neutral" />;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.dataEsame}>{fmtDate(appello.dataInizioApp)}</Text>
        {appello.prenotato ? (
          <Badge label={t("stato_prenotato")} tone="success" />
        ) : null}
      </View>
      <Text style={styles.desApp}>{appello.desApp}</Text>
      <Text style={styles.meta}>
        {t("iscrizioni_range", {
          da: fmtDate(appello.dataInizioIscr),
          a: fmtDate(appello.dataFineIscr),
        })}
      </Text>
      <Text style={styles.meta}>
        {t("iscritti_n", { n: appello.numIscritti })}
      </Text>
      <View style={styles.azione}>{azione()}</View>
    </Card>
  );
}

export function EsameDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const params = useRoute().params as EsameDetailParams;

  const [appelli, setAppelli] = useState<AppelloConStato[] | null>(null);
  const [esse3Error, setEsse3Error] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const client = useAuthStore.getState().getEsse3();
    if (!client) return;
    setEsse3Error(false);
    try {
      setAppelli(
        await client.getAppelliConStato(
          params.matId,
          params.cdsId,
          params.adId,
        ),
      );
    } catch {
      // Esse3 limita l'accesso agli appelli di questo insegnamento: mostriamo
      // lo stato friendly con il deep-link a Esse3 (niente errore tecnico grezzo).
      setEsse3Error(true);
    }
  }, [params.matId, params.cdsId, params.adId]);

  useEffect(() => {
    load();
  }, [load]);

  const doPrenota = async (a: AppelloConStato) => {
    const client = useAuthStore.getState().getEsse3();
    if (!client) return;
    setBusy(a.appId);
    try {
      await client.prenota(params.cdsId, params.adId, a.appId, params.adsceId);
      showToast.success({ message: t("prenotazione_ok") });
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/questionario/i.test(msg)) {
        Alert.alert(t("questionario_titolo"), t("questionario_msg"), [
          { text: t("chiudi"), style: "cancel" },
          {
            text: t("vai_questionario"),
            onPress: () => Linking.openURL(OPIS_URL),
          },
        ]);
      } else {
        showToast.error({ message: msg });
      }
    } finally {
      setBusy(null);
    }
  };

  const doDisiscrivi = async (a: AppelloConStato) => {
    const client = useAuthStore.getState().getEsse3();
    if (!client) return;
    setBusy(a.appId);
    try {
      await client.disiscrivi(params.cdsId, params.adId, a.appId, params.stuId);
      showToast.success({ message: t("disiscrizione_ok") });
      await load();
    } catch (err) {
      showToast.error({
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(null);
    }
  };

  const confirmPrenota = (a: AppelloConStato) =>
    Alert.alert(t("conferma_prenotazione_titolo"), t("conferma_prenotazione_msg"), [
      { text: t("annulla"), style: "cancel" },
      { text: t("prenota"), onPress: () => doPrenota(a) },
    ]);

  const confirmDisiscrivi = (a: AppelloConStato) =>
    Alert.alert(t("conferma_disiscrizione_titolo"), t("conferma_disiscrizione_msg"), [
      { text: t("annulla"), style: "cancel" },
      {
        text: t("disiscriviti"),
        style: "destructive",
        onPress: () => doDisiscrivi(a),
      },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
          activeOpacity={0.6}
          style={styles.back}
        >
          <ArrowLeft size={24} color={theme.colors.gray700} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>
          {params.nome}
        </Text>
      </View>

      {esse3Error ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ErrorView
            title={t("appelli_non_disponibili_titolo")}
            message={t("appelli_non_disponibili_msg")}
            action={
              <DfButton
                label={t("apri_su_esse3")}
                variant="outlined"
                color={theme.colors.primary}
                fullWidth={false}
                onPress={() => Linking.openURL(OPIS_URL)}
              />
            }
          />
        </ScrollView>
      ) : appelli === null ? (
        <LoadingView />
      ) : appelli.length === 0 ? (
        <View style={styles.scroll}>
          <EmptyView message={t("nessun_appello")} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {appelli.map((a) => (
            <AppelloCard
              key={a.appId}
              appello={a}
              busy={busy === a.appId}
              onPrenota={() => confirmPrenota(a)}
              onDisiscrivi={() => confirmDisiscrivi(a)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.gray50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  back: {
    padding: theme.spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.gray900,
  },
  scroll: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    gap: 4,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dataEsame: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.gray900,
  },
  desApp: {
    fontSize: 14,
    color: theme.colors.gray700,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.gray500,
  },
  azione: {
    marginTop: theme.spacing.sm,
  },
});
