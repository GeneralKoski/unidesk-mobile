import { DfBottomSheet } from "@/src/components/DfBottomSheet";
import { Text } from "@/src/components/ui";
import { useTranslation } from "@/src/hooks/useTranslation";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
} from "@/src/stores/translationStore";
import { theme } from "@/src/styles";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Check } from "lucide-react-native";
import React, { forwardRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

// Drawer di selezione lingua (single-select con spunta). Si apre chiamando
// .present() sul ref del BottomSheetModal.
export const LanguageSheet = forwardRef<BottomSheetModal>((_props, ref) => {
  const { t, language, setLanguage } = useTranslation();

  const dismiss = () => {
    if (typeof ref === "object" && ref?.current) ref.current.dismiss();
  };

  return (
    <DfBottomSheet ref={ref} title={t("lingua")}>
      <View style={styles.list}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const checked = lang === language;
          return (
            <TouchableOpacity
              key={lang}
              style={styles.row}
              activeOpacity={0.6}
              onPress={() => {
                setLanguage(lang);
                dismiss();
              }}
            >
              <Text
                style={[styles.text, checked && styles.textOn]}
                numberOfLines={1}
              >
                {LANGUAGE_LABELS[lang]}
              </Text>
              {checked ? <Check size={20} color={theme.colors.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </DfBottomSheet>
  );
});

LanguageSheet.displayName = "LanguageSheet";

const styles = StyleSheet.create({
  list: {
    marginTop: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.gray100,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.gray900,
  },
  textOn: {
    fontWeight: "700",
    color: theme.colors.primary,
  },
});
