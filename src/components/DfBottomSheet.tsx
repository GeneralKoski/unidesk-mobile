import { useAppTheme } from "@/src/components/ThemeContext";
import { Text } from "@/src/components/ui";
import { theme } from "@/src/styles";
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { forwardRef, useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DfBottomSheetProps {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onDismiss?: () => void;
  // Contenuto fisso (non scrollabile) quando false. Default: scrollabile.
  scrollable?: boolean;
  // Stile "action sheet" iOS: sfondo trasparente, contenuto in una card e
  // footer (es. "Annulla") in una card staccata sotto. Implica non scrollabile.
  detached?: boolean;
  footer?: React.ReactNode;
  // Spazio extra sotto il contenuto, sommato alla safe-area inferiore (default 16).
  bottomPadding?: number;
  // Intercetta il back Android quando lo sheet è aperto (tasto o swipe predittivo).
  // Se ritorna true il back è gestito internamente (es. torna dalla sotto-schermata)
  // e lo sheet resta aperto; se ritorna false lo sheet viene chiuso.
  onAndroidBack?: () => boolean;
}

export const DfBottomSheet = forwardRef<BottomSheetModal, DfBottomSheetProps>(
  (
    {
      title,
      children,
      style,
      onDismiss,
      scrollable = true,
      detached,
      footer,
      bottomPadding = 16,
      onAndroidBack,
    },
    ref,
  ) => {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isIOS = Platform.OS === "ios";
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const dismiss = useCallback(() => {
      if (typeof ref === "object" && ref?.current) ref.current.dismiss();
    }, [ref]);

    // Gestione del back Android mentre lo sheet è aperto: senza questo il tasto
    // indietro / lo swipe predittivo raggiungerebbero react-navigation facendo il
    // pop della schermata sottostante invece di chiudere lo sheet.
    useEffect(() => {
      if (!isOpen) return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (onAndroidBack?.()) return true;
        dismiss();
        return true;
      });
      return () => sub.remove();
    }, [isOpen, onAndroidBack, dismiss]);

    useEffect(() => {
      const showSub = Keyboard.addListener("keyboardDidShow", () =>
        setIsKeyboardOpen(true),
      );
      const hideSub = Keyboard.addListener("keyboardDidHide", () =>
        setIsKeyboardOpen(false),
      );

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      ),
      [],
    );

    const safeBottomInset = insets.bottom + bottomPadding;

    // Footer sticky (fisso in basso, il contenuto scrolla sotto). Usato dai
    // drawer filtri per tenere sempre visibili Reimposta/Applica.
    const [footerHeight, setFooterHeight] = useState(0);
    const hasStickyFooter = !detached && !!footer;

    const renderFooter = useCallback(
      (props: any) => (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            style={[styles.stickyFooter, { paddingBottom: safeBottomInset }]}
          >
            {footer}
          </View>
        </BottomSheetFooter>
      ),
      [footer, safeBottomInset],
    );

    const header = (
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Pressable onPress={dismiss}>
          {({ pressed }) => (
            <View style={[styles.closeButton, pressed && { opacity: 0.75 }]}>
              <X size={24} color={colors.text} />
            </View>
          )}
        </Pressable>
      </View>
    );

    return (
      <BottomSheetModal
        ref={ref}
        // iOS: NON commutare enableDynamicSizing/snapPoints al variare della
        // tastiera (rimonterebbe lo sheet a ogni show/hide -> loop "su e giù").
        // Dynamic sizing sempre attivo, la tastiera è gestita da keyboardBehavior.
        // Android: mantiene il toggle (con adjustResize non innesca il loop).
        enableDynamicSizing={isIOS ? true : !isKeyboardOpen}
        maxDynamicContentSize={MAX_SHEET_HEIGHT}
        snapPoints={!isIOS && isKeyboardOpen ? ["88%"] : undefined}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onChange={(index) => setIsOpen(index >= 0)}
        onDismiss={() => {
          setIsOpen(false);
          Keyboard.dismiss();
          onDismiss?.();
        }}
        backdropComponent={renderBackdrop}
        backgroundStyle={
          detached
            ? { backgroundColor: "transparent" }
            : { backgroundColor: theme.colors.white }
        }
        handleComponent={detached ? null : undefined}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        footerComponent={hasStickyFooter ? renderFooter : undefined}
      >
        {detached ? (
          <BottomSheetView style={styles.detachedWrap}>
            <View style={[styles.detachedCard, style]}>
              {title && header}
              {children}
            </View>
            {footer ? (
              <View style={styles.detachedFooter}>{footer}</View>
            ) : null}
            <View style={{ height: safeBottomInset }} />
          </BottomSheetView>
        ) : scrollable ? (
          <BottomSheetScrollView
            style={[styles.content, style]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {title && header}
            {children}
            {hasStickyFooter ? (
              <View style={{ height: footerHeight }} />
            ) : !isKeyboardOpen ? (
              <View style={{ height: safeBottomInset }} />
            ) : null}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={[styles.content, style]}>
            {title && header}
            {children}
            <View style={{ height: safeBottomInset }} />
          </BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

DfBottomSheet.displayName = "DfBottomSheet";

const MAX_SHEET_HEIGHT = Dimensions.get("window").height * 0.85;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.md,
  },
  detachedWrap: {
    paddingHorizontal: theme.spacing.sm,
  },
  detachedCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  detachedFooter: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    marginTop: theme.spacing.sm,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stickyFooter: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
