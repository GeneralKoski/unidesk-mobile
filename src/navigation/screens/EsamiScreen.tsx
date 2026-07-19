import type { RigaDaSostenere } from "@/src/api/unidesk/types";
import { getFloatingTabBarSpace } from "@/src/components/FloatingTabBar";
import { Screen, ScreenHeader } from "@/src/components/Screen";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { DaSostenereItem } from "@/src/containers/esami/EsameItems";
import { useTranslation } from "@/src/hooks/useTranslation";
import { useAuthStore } from "@/src/stores/authStore";
import { useCareerStore } from "@/src/stores/careerStore";
import { theme } from "@/src/styles";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function EsamiScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const selectedMatId = useCareerStore((s) => s.selectedMatId);
  const loadCareers = useCareerStore((s) => s.load);

  const [rows, setRows] = useState<RigaDaSostenere[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  const load = useCallback(async () => {
    if (selectedMatId == null) return;
    const client = useAuthStore.getState().getEsse3();
    if (!client) return;
    setError(null);
    try {
      setRows(await client.getDaSostenere(selectedMatId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [selectedMatId]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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

  const bottomSpace = getFloatingTabBarSpace(insets.bottom);

  return (
    <Screen>
      <ScreenHeader title={t("nav_esami")} subtitle={t("esami_subtitle")} />
      {error ? (
        <View style={{ paddingTop: theme.spacing.md }}>
          <ErrorView title={t("esse3_error")} message={error} />
        </View>
      ) : rows === null ? (
        <LoadingView />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.chiaveADContestualizzata.adId)}
          renderItem={({ item }) => (
            <DaSostenereItem riga={item} onPress={() => goToEsame(item)} card />
          )}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.md,
            paddingBottom: bottomSpace,
            gap: theme.spacing.sm,
          }}
          ListEmptyComponent={
            <EmptyView message={t("nessun_esame_da_sostenere")} />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </Screen>
  );
}
