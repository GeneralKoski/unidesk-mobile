import { Text } from "@/src/components/ui";
import { theme } from "@/src/styles";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export interface Tab {
  key: string;
  label: string;
}

interface DfTabViewProps {
  tabs: Tab[];
  defaultTab?: string;
  withShadow?: boolean;
  onTabChange?: (key: string) => void;
  renderContent: (activeTab: string) => React.ReactNode;
}

const INDICATOR_PADDING = 6;
const TAB_GAP = 4;
const ANIMATION_DURATION = 200;

export const DfTabView = ({
  tabs,
  defaultTab,
  onTabChange,
  renderContent,
  withShadow = false,
}: DfTabViewProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.key);
  const [tabBarWidth, setTabBarWidth] = useState(0);

  const tabWidth =
    tabBarWidth > 0
      ? (tabBarWidth - INDICATOR_PADDING * 2 - TAB_GAP * (tabs.length - 1)) /
        tabs.length
      : 0;

  const indicatorLeft = useSharedValue(0);

  const updatePosition = (index: number) => {
    indicatorLeft.value = withTiming(
      INDICATOR_PADDING + index * (tabWidth + TAB_GAP),
      { duration: ANIMATION_DURATION },
    );
  };

  const handleTabPress = (key: string, index: number) => {
    setActiveTab(key);
    updatePosition(index);
    onTabChange?.(key);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
  }));

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.tabBar, withShadow && styles.shadow]}
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          setTabBarWidth(width);
          const initialIndex = tabs.findIndex(
            (t) => t.key === (defaultTab ?? tabs[0]?.key),
          );
          const tw =
            (width - INDICATOR_PADDING * 2 - TAB_GAP * (tabs.length - 1)) /
            tabs.length;
          indicatorLeft.value =
            INDICATOR_PADDING + initialIndex * (tw + TAB_GAP);
        }}
      >
        {tabBarWidth > 0 && (
          <Animated.View
            style={[styles.indicator, { width: tabWidth }, indicatorStyle]}
          />
        )}
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => handleTabPress(tab.key, index)}
            >
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {renderContent(activeTab)}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.radius.xl,
    padding: INDICATOR_PADDING,
    gap: TAB_GAP,
  },
  shadow: {
    shadowColor: theme.colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  indicator: {
    position: "absolute",
    top: INDICATOR_PADDING,
    bottom: INDICATOR_PADDING,
    backgroundColor: theme.colors.gray600,
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.gray600,
    includeFontPadding: false,
  },
  tabLabelActive: {
    color: theme.colors.white,
  },
});
