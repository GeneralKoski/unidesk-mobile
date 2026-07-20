import { Text } from "@/src/components/ui";
import type { FileViewerParams } from "@/src/navigation";
import { theme } from "@/src/styles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { ArrowLeft, Share2 } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Pdf from "react-native-pdf";

export function FileViewerScreen() {
  const navigation = useNavigation<any>();
  const { uri, kind, name } = useRoute().params as FileViewerParams;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
          activeOpacity={0.6}
          style={styles.iconBtn}
        >
          <ArrowLeft size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {name}
        </Text>
        <TouchableOpacity
          onPress={() => Sharing.shareAsync(uri).catch(() => {})}
          hitSlop={10}
          activeOpacity={0.6}
          style={styles.iconBtn}
        >
          <Share2 size={22} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {kind === "pdf" ? (
        <Pdf source={{ uri }} style={styles.pdf} trustAllCerts={false} />
      ) : (
        <Image source={{ uri }} style={styles.image} contentFit="contain" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  iconBtn: {
    padding: theme.spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.white,
  },
  pdf: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    flex: 1,
  },
});
