import { Text } from "@/src/components/ui";
import { useTranslation } from "@/src/hooks/useTranslation";
import { theme } from "@/src/styles";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Chiave i18n per nome route: le label si traducono qui (reattive al cambio
// lingua), non via options.title che è statico (valutato una volta al mount).
const LABEL_KEY: Record<string, string> = {
  Home: "nav_home",
  Esami: "nav_esami",
  Corsi: "nav_corsi",
};

// Altezza della pillola (senza il margine safe-area sotto). Le liste usano
// getFloatingTabBarSpace() per lo spazio in fondo, dato che la navbar è un
// overlay assoluto (non riserva spazio come una tab bar standard).
export const FLOATING_TAB_BAR_HEIGHT = 64;
export const FLOATING_TAB_BAR_MARGIN = theme.spacing.md;

export function getFloatingTabBarSpace(bottomInset: number): number {
  return FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottomInset;
}

// Floating navbar: unica navigazione tra le pagine (Home, Esami, Corsi).
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { bottom: Math.max(insets.bottom, theme.spacing.sm) },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const labelKey = LABEL_KEY[route.name];
          const label = labelKey ? t(labelKey) : (options.title ?? route.name);
          const color = focused ? theme.colors.primary : theme.colors.gray400;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icon = options.tabBarIcon?.({
            focused,
            color,
            size: 24,
          });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              activeOpacity={0.6}
              style={styles.item}
            >
              <View style={styles.iconWrap}>{icon}</View>
              <Text
                numberOfLines={1}
                style={[styles.label, { color }]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: FLOATING_TAB_BAR_HEIGHT,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    minWidth: 260,
    borderWidth: 1,
    borderColor: theme.colors.gray100,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    gap: 2,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
});
