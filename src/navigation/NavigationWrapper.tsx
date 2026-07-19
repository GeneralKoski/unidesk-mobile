import { CommonActions } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { Navigation } from "@/src/navigation";
import { navigationRef } from "@/src/navigation/navigationRef";
import { useAuthStore } from "@/src/stores/authStore";

const linking = {
  enabled: "auto" as const,
  prefixes: [],
};

/**
 * Schermate accessibili senza autenticazione.
 * Aggiungere qui ogni screen pubblico per evitare redirect indesiderati.
 */
const GUEST_SCREENS = ["Login"];

interface NavigationWrapperProps {
  onReady?: () => void;
}

export const NavigationWrapper: React.FC<NavigationWrapperProps> = ({
  onReady,
}) => {
  const routeNameRef = useRef<string | undefined>(undefined);
  const [navigationReady, setNavigationReady] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthInitialized = useAuthStore((s) => s.isInitialized);

  // Calcolato una sola volta al mount: evita il flash della schermata
  // iniziale quando l'utente è già autenticato all'avvio.
  // Su web lasciamo che sia il linking config (URL) a decidere la rotta iniziale
  const initialStateRef = useRef(
    Platform.OS !== "web" && isAuthenticated
      ? { index: 0, routes: [{ name: "Tabs" as const }] }
      : undefined,
  );

  useEffect(() => {
    if (!navigationReady || !isAuthInitialized || !navigationRef.isReady())
      return;

    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (!currentRoute) return;

    if (!isAuthenticated && !GUEST_SCREENS.includes(currentRoute)) {
      navigationRef.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Login" as never }] }),
      );
    } else if (isAuthenticated && GUEST_SCREENS.includes(currentRoute)) {
      // Appena autenticato mentre sei su una schermata guest (Login): entra.
      navigationRef.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Tabs" as never }] }),
      );
    }
  }, [navigationReady, isAuthenticated, isAuthInitialized]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleReady = () => {
    const currentRoute = navigationRef.getCurrentRoute();
    routeNameRef.current = currentRoute?.name;

    setNavigationReady(true);
    onReady?.();
  };

  const handleStateChange = () => {
    const currentRoute = navigationRef.getCurrentRoute();
    const currentRouteName = currentRoute?.name;

    // Punto di estensione per analytics/screen tracking:
    // const previousRouteName = routeNameRef.current;
    // if (previousRouteName !== currentRouteName && currentRouteName) {
    //   analyticsService.logScreenView(currentRouteName);
    // }

    routeNameRef.current = currentRouteName;
  };

  return (
    <Navigation
      ref={navigationRef}
      linking={linking}
      initialState={initialStateRef.current}
      onReady={handleReady}
      onStateChange={handleStateChange}
    />
  );
};
