import { Text } from "@/src/components/ui/Text";
import { theme } from "@/src/styles";
import { hexToRgba } from "@/src/utils/utils";
import React from "react";
import { StyleSheet, View } from "react-native";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "purple";

const TONES: Record<BadgeTone, string> = {
  neutral: theme.colors.gray500,
  primary: theme.colors.primary,
  success: theme.colors.success,
  warning: theme.colors.warning,
  danger: theme.colors.error,
  purple: "#722ed1",
};

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: BadgeTone;
}) {
  const color = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: hexToRgba(color, 0.12) }]}>
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
