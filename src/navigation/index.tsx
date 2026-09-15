import { FloatingTabBar } from "@/src/components/FloatingTabBar";
import { i18n } from "@/src/i18n";
import { theme } from "@/src/styles";
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import {
  createStaticNavigation,
  type StaticParamList,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BookOpen, CalendarDays, LayoutDashboard } from "lucide-react-native";
import React from "react";

import { CorsiScreen } from "@/src/navigation/screens/CorsiScreen";
import { CorsoDetailScreen } from "@/src/navigation/screens/CorsoDetailScreen";
import { EsameDetailScreen } from "@/src/navigation/screens/EsameDetailScreen";
import { EsamiScreen } from "@/src/navigation/screens/EsamiScreen";
import { FileViewerScreen } from "@/src/navigation/screens/FileViewerScreen";
import { HomeScreen } from "@/src/navigation/screens/HomeScreen";
import { LoginScreen } from "@/src/navigation/screens/LoginScreen";

// ─── Tab navigator (floating navbar) ───────────────────────────────────────────

const Tab = createBottomTabNavigator({
  tabBar: (props) => <FloatingTabBar {...props} />,
  screenOptions: {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.gray400,
  } satisfies BottomTabNavigationOptions,
  screens: {
    Home: {
      screen: HomeScreen,
      options: {
        title: i18n.t("nav_home"),
        tabBarIcon: ({ color, focused }) => (
          <LayoutDashboard
            color={color}
            size={24}
            strokeWidth={focused ? 2.5 : 2}
          />
        ),
      },
    },
    Esami: {
      screen: EsamiScreen,
      options: {
        title: i18n.t("nav_esami"),
        tabBarIcon: ({ color, focused }) => (
          <CalendarDays
            color={color}
            size={24}
            strokeWidth={focused ? 2.5 : 2}
          />
        ),
      },
    },
    Corsi: {
      screen: CorsiScreen,
      options: {
        title: i18n.t("nav_corsi"),
        tabBarIcon: ({ color, focused }) => (
          <BookOpen color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
        ),
      },
    },
  },
});

// ─── Root stack ─────────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Login: {
      screen: LoginScreen,
      linking: { path: "login" },
    },
    Tabs: {
      screen: Tab,
      linking: { path: "" },
    },
    EsameDetail: {
      screen: EsameDetailScreen,
      linking: { path: "esame/:adId" },
      options: { presentation: "card" },
    },
    CorsoDetail: {
      screen: CorsoDetailScreen,
      linking: { path: "corso/:id" },
      options: { presentation: "card" },
    },
    FileViewer: {
      screen: FileViewerScreen,
      options: { presentation: "fullScreenModal" },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

export type RootStackParamList = StaticParamList<typeof RootStack>;

// Parametri delle schermate detail.
export interface EsameDetailParams {
  adId: number;
  matId: number;
  cdsId: number;
  adsceId: number;
  stuId: number;
  nome: string;
}

export interface CorsoDetailParams {
  id: number;
  nome: string;
  // Istanza Elly del corso: gli id sono per-istanza (vedi Course.base).
  base?: string;
}

export interface FileViewerParams {
  uri: string;
  kind: "pdf" | "image";
  name: string;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {
      EsameDetail: EsameDetailParams;
      CorsoDetail: CorsoDetailParams;
      FileViewer: FileViewerParams;
    }
  }
}
