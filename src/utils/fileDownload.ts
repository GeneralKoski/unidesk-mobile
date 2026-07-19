import { ellyApi } from "@/src/api/unidesk/elly";
import { logger } from "@/src/utils/logger";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// Converte un Blob in base64 (senza prefisso data:) via FileReader.
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lettura file fallita"));
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(blob);
  });
}

function safeName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "file";
}

// Scarica un materiale Elly tramite il proxy del backend (che usa la sessione
// Moodle server-side) e lo apre nel foglio di condivisione del sistema. Il fetch
// riusa il cookie jar nativo di RN, la stessa sessione backend di ellyApi.
export async function downloadEllyFile(
  fileUrl: string,
  filename: string,
): Promise<void> {
  await ellyApi.ensureSession();

  const res = await fetch(fileUrl, {
    credentials: "include",
    headers: { Accept: "*/*" },
  });
  if (!res.ok) {
    throw new Error(`Download fallito (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  const base64 = await blobToBase64(blob);

  const target = FileSystem.cacheDirectory + safeName(filename);
  await FileSystem.writeAsStringAsync(target, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target);
  } else {
    logger.info("[fileDownload] Sharing non disponibile su questa piattaforma");
    throw new Error("Condivisione non disponibile");
  }
}
