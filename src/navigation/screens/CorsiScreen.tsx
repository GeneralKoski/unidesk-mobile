import type { Course } from "@/src/api/unidesk/types";
import { ellyApi } from "@/src/api/unidesk/elly";
import { getFloatingTabBarSpace } from "@/src/components/FloatingTabBar";
import { Screen, ScreenHeader } from "@/src/components/Screen";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { Text } from "@/src/components/ui";
import { HAS_BACKEND } from "@/src/consts";
import { useTranslation } from "@/src/hooks/useTranslation";
import { theme } from "@/src/styles";
import { useNavigation } from "@react-navigation/native";
import { BookOpen, ChevronRight } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function CorsiScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!HAS_BACKEND) return;
    setError(null);
    try {
      setCourses(await ellyApi.getCourses());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const bottomSpace = getFloatingTabBarSpace(insets.bottom);

  const renderBody = () => {
    if (!HAS_BACKEND) {
      return (
        <View style={styles.stateWrap}>
          <EmptyView message={t("corsi_backend_richiesto")} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateWrap}>
          <ErrorView title={t("elly_error")} message={error} />
        </View>
      );
    }
    if (courses === null) return <LoadingView />;

    return (
      <FlatList
        data={courses}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.6}
            style={styles.courseRow}
            onPress={() =>
              navigation.navigate("CorsoDetail", {
                id: item.id,
                nome: item.fullname ?? item.shortname,
                base: item.base,
              })
            }
          >
            <View style={styles.courseIcon}>
              <BookOpen size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.courseText}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {item.fullname ?? item.shortname}
              </Text>
              {item.shortname || item.year ? (
                <Text style={styles.courseSub} numberOfLines={1}>
                  {[
                    item.shortname,
                    item.year
                      ? `${item.year}/${String(item.year + 1).slice(2)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              ) : null}
            </View>
            <ChevronRight size={20} color={theme.colors.gray400} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingBottom: bottomSpace,
          gap: theme.spacing.sm,
        }}
        ListEmptyComponent={<EmptyView message={t("nessun_corso")} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    );
  };

  return (
    <Screen>
      <ScreenHeader title={t("nav_corsi")} subtitle={t("corsi_subtitle")} />
      {renderBody()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stateWrap: {
    paddingTop: theme.spacing.md,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray100,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    backgroundColor: "#e6f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  courseText: {
    flex: 1,
    gap: 2,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.gray900,
  },
  courseSub: {
    fontSize: 13,
    color: theme.colors.gray500,
  },
});
