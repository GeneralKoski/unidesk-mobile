import { DfButton } from "@/src/components/form/DfButton";
import { DfInput } from "@/src/components/form/DfInput";
import { DfPassword } from "@/src/components/form/DfPassword";
import { FormScreen } from "@/src/components/FormScreen";
import { useAppTheme } from "@/src/components/ThemeContext";
import { Text } from "@/src/components/ui";
import { useTranslation } from "@/src/hooks/useTranslation";
import { useAuthStore } from "@/src/stores/authStore";
import { theme } from "@/src/styles";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, View } from "react-native";
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
  const submitting = useRef(false);

  const form = useForm<LoginFormValues>({ mode: "onSubmit" });

  const doLogin = useCallback(
    async (email: string, password: string) => {
      if (submitting.current) return;
      submitting.current = true;
      setError(null);
      setLoading(true);
      const res = await login(email.trim(), password);
      setLoading(false);
      submitting.current = false;
      if (!res.ok) setError(res.error);
      // In caso di successo il redirect è gestito da NavigationWrapper.
    },
    [login],
  );

  const submit = form.handleSubmit((v) => doLogin(v.email, v.password));

  // Autologin quando il gestore password compila email + password in un colpo
  // solo (l'autofill riempie i campi con più caratteri insieme, non uno a uno).
  useEffect(() => {
    const prevLen = { email: 0, password: 0 };
    const sub = form.watch((values, { name }) => {
      const email = values.email ?? "";
      const password = values.password ?? "";
      const jumped =
        (name === "email" && email.length - prevLen.email > 1) ||
        (name === "password" && password.length - prevLen.password > 1);
      prevLen.email = email.length;
      prevLen.password = password.length;
      if (jumped && email.trim() && password) {
        Keyboard.dismiss();
        doLogin(email, password);
      }
    });
    return () => sub.unsubscribe();
  }, [form, doLogin]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FormScreen contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
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
            autoComplete="username"
            textContentType="username"
            importantForAutofill="yes"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => form.setFocus("password")}
            rules={{ required: t("email_required") }}
          />
          <DfPassword
            name="password"
            label={t("password")}
            returnKeyType="go"
            onSubmitEditing={submit}
            rules={{ required: t("password_required") }}
          />
          <DfButton
            label={t("login")}
            color={theme.colors.primary}
            loading={loading}
            onPress={submit}
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
    width: 72,
    height: 72,
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
