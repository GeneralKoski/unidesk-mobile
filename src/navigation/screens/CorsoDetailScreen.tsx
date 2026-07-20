import type { Module, Section } from "@/src/api/unidesk/types";
import { ellyApi } from "@/src/api/unidesk/elly";
import type { CorsoDetailParams } from "@/src/navigation";
import { Card, Text } from "@/src/components/ui";
import { EmptyView, ErrorView, LoadingView } from "@/src/components/StateViews";
import { downloadEllyFile, downloadEllyFileToCache } from "@/src/utils/fileDownload";
import {
  fileCategory,
  fileExtLabel,
  isInAppViewable,
  type FileCategory,
  type FileMeta,
} from "@/src/utils/fileType";
import { useTranslation } from "@/src/hooks/useTranslation";
import { showToast } from "@/src/utils/toast";
import { theme } from "@/src/styles";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Link as LinkIcon,
  Presentation,
  type LucideIcon,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function fileIcon(cat: FileCategory): { Icon: LucideIcon; color: string } {
  switch (cat) {
    case "pdf":
      return { Icon: FileText, color: "#dc2626" };
    case "image":
      return { Icon: FileImage, color: "#7c3aed" };
    case "word":
      return { Icon: FileText, color: "#2563eb" };
    case "excel":
      return { Icon: FileSpreadsheet, color: "#16a34a" };
    case "ppt":
      return { Icon: Presentation, color: "#ea580c" };
    case "archive":
      return { Icon: FileArchive, color: theme.colors.gray600 };
    case "text":
      return { Icon: FileText, color: theme.colors.gray600 };
    default:
      return { Icon: FileIcon, color: theme.colors.primary };
  }
}

interface OpenOpts {
  modname?: string;
  filename?: string;
  mimetype?: string;
}

function useFileOpen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [busy, setBusy] = useState(false);

  const open = useCallback(
    async (url: string, name: string, opts: OpenOpts = {}) => {
      const { modname, filename, mimetype } = opts;
      // "url" (link esterni) e attività interattive: apri nel browser.
      if (modname && modname !== "resource" && modname !== "folder") {
        Linking.openURL(url).catch(() => {
          showToast.error({ message: t("apertura_fallita") });
        });
        return;
      }
      const cat = fileCategory({ filename, mimetype, name, url });
      const fileUrl = ellyApi.fileUrl(url, modname);
      const displayName = filename ?? name;
      setBusy(true);
      try {
        if (isInAppViewable(cat)) {
          // PDF e immagini: scarica in cache e apri nel viewer in-app.
          const { uri } = await downloadEllyFileToCache(fileUrl, displayName);
          navigation.navigate("FileViewer", { uri, kind: cat, name: displayName });
        } else {
          // Altri formati: scarica e passa al foglio di condivisione.
          await downloadEllyFile(fileUrl, displayName);
        }
      } catch (err) {
        showToast.error({
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setBusy(false);
      }
    },
    [navigation, t],
  );

  return { open, busy };
}

function FileRow({
  name,
  meta,
  onPress,
  disabled,
  nested,
}: {
  name: string;
  meta: FileMeta;
  onPress: () => void;
  disabled: boolean;
  nested?: boolean;
}) {
  const cat = fileCategory(meta);
  const { Icon, color } = fileIcon(cat);
  const ext = fileExtLabel(meta);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      disabled={disabled}
      style={[styles.moduleRow, nested && styles.nested]}
    >
      <Icon size={18} color={color} />
      <Text style={styles.moduleName} numberOfLines={2}>
        {name}
      </Text>
      {ext ? <Text style={styles.ext}>{ext}</Text> : null}
    </TouchableOpacity>
  );
}

function FolderItem({ m }: { m: Module }) {
  const { t } = useTranslation();
  const { open, busy } = useFileOpen();
  const [openState, setOpenState] = useState(false);
  const [files, setFiles] = useState<{ name: string; url: string }[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setOpenState((o) => !o);
    if (files || !m.url) return;
    setLoading(true);
    try {
      setFiles(await ellyApi.getFolder(m.url));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.6}
        style={styles.moduleRow}
      >
        <Folder size={18} color={theme.colors.gray600} />
        <Text style={styles.moduleName} numberOfLines={2}>
          {m.name}
        </Text>
        {openState ? (
          <ChevronDown size={18} color={theme.colors.gray400} />
        ) : (
          <ChevronRight size={18} color={theme.colors.gray400} />
        )}
      </TouchableOpacity>
      {openState ? (
        loading ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.nested}
          />
        ) : error ? (
          <Text style={[styles.nested, styles.error]}>{error}</Text>
        ) : (files?.length ?? 0) === 0 ? (
          <Text style={[styles.nested, styles.meta]}>
            {t("cartella_vuota")}
          </Text>
        ) : (
          files?.map((f) => (
            <FileRow
              key={f.url}
              name={f.name}
              meta={{ name: f.name, url: f.url }}
              onPress={() => open(f.url, f.name)}
              disabled={busy}
              nested
            />
          ))
        )
      ) : null}
    </View>
  );
}

function ModuleItem({ m }: { m: Module }) {
  const { open, busy } = useFileOpen();
  if (m.modname === "folder") return <FolderItem m={m} />;

  const isFile = m.modname === "resource";
  const meta: FileMeta = {
    filename: m.filename,
    mimetype: m.mimetype,
    name: m.name,
    url: m.url,
  };

  if (!m.url) {
    const Icon = isFile ? FileIcon : LinkIcon;
    return (
      <View style={styles.moduleRow}>
        <Icon size={18} color={theme.colors.gray400} />
        <Text style={styles.moduleName}>{m.name}</Text>
      </View>
    );
  }

  // Risorsa file: icona per tipo. Link/altro: icona link.
  if (!isFile) {
    return (
      <TouchableOpacity
        onPress={() => open(m.url!, m.name, { modname: m.modname })}
        activeOpacity={0.6}
        disabled={busy}
        style={styles.moduleRow}
      >
        <LinkIcon size={18} color={theme.colors.gray600} />
        <Text style={styles.moduleName} numberOfLines={2}>
          {m.name}
        </Text>
        {busy ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <FileRow
      name={m.name}
      meta={meta}
      onPress={() =>
        open(m.url!, m.name, {
          modname: m.modname,
          filename: m.filename,
          mimetype: m.mimetype,
        })
      }
      disabled={busy}
    />
  );
}

export function CorsoDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const params = useRoute().params as CorsoDetailParams;

  const [sections, setSections] = useState<Section[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSections(await ellyApi.getContents(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
          activeOpacity={0.6}
          style={styles.back}
        >
          <ArrowLeft size={24} color={theme.colors.gray700} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>
          {params.nome}
        </Text>
      </View>

      {error ? (
        <View style={styles.scroll}>
          <ErrorView title={t("elly_error")} message={error} />
        </View>
      ) : sections === null ? (
        <LoadingView />
      ) : sections.length === 0 ? (
        <View style={styles.scroll}>
          <EmptyView message={t("nessun_contenuto")} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {sections.map((s) => (
            <Card
              key={s.id}
              title={s.name || t("sezione_n", { n: s.section })}
            >
              {s.modules.map((m) => (
                <ModuleItem key={m.id} m={m} />
              ))}
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.gray50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  back: {
    padding: theme.spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.gray900,
  },
  scroll: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray100,
  },
  moduleName: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.gray800,
  },
  ext: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.gray400,
  },
  nested: {
    marginLeft: theme.spacing.lg,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.gray500,
    paddingVertical: theme.spacing.sm,
  },
  error: {
    fontSize: 13,
    color: theme.colors.error,
    paddingVertical: theme.spacing.sm,
  },
});
