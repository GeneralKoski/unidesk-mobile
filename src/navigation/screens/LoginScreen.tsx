import { DfButton } from "@/src/components/form/DfButton";
import { DfInput } from "@/src/components/form/DfInput";
import { DfPassword } from "@/src/components/form/DfPassword";
import { FormScreen } from "@/src/components/FormScreen";
import { useAppTheme } from "@/src/components/ThemeContext";
import { Text } from "@/src/components/ui";
import { useTranslation } from "@/src/hooks/useTranslation";
import { useAuthStore } from "@/src/stores/authStore";
import { theme } from "@/src/styles";
import { GraduationCap } from "lucide-react-native";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({ mode: "onSubmit" });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    setLoading(true);
    const res = await login(values.email.trim(), values.password);
    setLoading(false);
    if (!res.ok) setError(res.error);
    // In caso di successo il redirect è gestito da NavigationWrapper.
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FormScreen contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <GraduationCap size={30} color={theme.colors.white} />
          </View>
          <Text style={styles.brandName}>Unidesk</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{t("login")}</Text>
          <Text style={styles.subtitle}>{t("login_subtitle")}</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FormProvider {...form}>
          <DfInput
            name="email"
            label={t("email")}
            placeholder={t("email_placeholder")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            rules={{ required: t("email_required") }}
          />
          <DfPassword
            name="password"
            label={t("password")}
            rules={{ required: t("password_required") }}
          />
          <DfButton
            label={t("login")}
            color={theme.colors.primary}
            loading={loading}
            onPress={form.handleSubmit(onSubmit)}
          />
        </FormProvider>

        <Text style={styles.disclaimer}>{t("login_disclaimer")}</Text>
      </FormScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.gray900,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontWeight: "700",
    fontSize: 24,
    color: theme.colors.gray900,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.gray500,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.gray400,
    marginTop: theme.spacing.lg,
    textAlign: "center",
  },
});
