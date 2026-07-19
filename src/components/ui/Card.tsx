import { Text } from "@/src/components/ui/Text";
import { useAppTheme } from "@/src/components/ThemeContext";
import { theme } from "@/src/styles";
import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, title, right, style, padded = true }: CardProps) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {(title || right) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      <View style={padded ? styles.body : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.gray900,
  },
  body: {
    padding: theme.spacing.md,
  },
});
