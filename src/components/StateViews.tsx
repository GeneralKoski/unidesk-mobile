import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui";
import { theme } from "@/src/styles";
import { AlertCircle, Inbox } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

export function ErrorView({
  title,
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <Card style={styles.stateCard}>
      <View style={styles.stateInner}>
        <AlertCircle size={32} color={theme.colors.error} />
        {title ? <Text style={styles.stateTitle}>{title}</Text> : null}
        <Text style={styles.stateMessage}>{message}</Text>
        {action}
      </View>
    </Card>
  );
}

export function EmptyView({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.stateInner}>
      <Inbox size={32} color={theme.colors.gray400} />
      <Text style={styles.stateMessage}>{message}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
  stateCard: {
    marginHorizontal: theme.spacing.md,
  },
  stateInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.gray900,
    textAlign: "center",
  },
  stateMessage: {
    fontSize: 14,
    color: theme.colors.gray500,
    textAlign: "center",
  },
});
