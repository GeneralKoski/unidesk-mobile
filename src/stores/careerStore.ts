import type { TrattoCarriera } from "@/src/api/unidesk/types";
import { logger } from "@/src/utils/logger";
import { create } from "zustand";
import { useAuthStore } from "./authStore";

interface CareerStore {
  carriere: TrattoCarriera[];
  selectedMatId: number | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  load: (force?: boolean) => Promise<void>;
  setSelected: (matId: number) => void;
  reset: () => void;
}

export const useCareerStore = create<CareerStore>((set, get) => ({
  carriere: [],
  selectedMatId: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  load: async (force = false) => {
    if (get().isLoading) return;
    if (get().isInitialized && !force) return;

    const client = useAuthStore.getState().getEsse3();
    if (!client) return;

    set({ isLoading: true, error: null });
    try {
      const carriere = await client.getCarriere();
      const attiva = carriere.find((t) => t.staStuCod === "A") ?? carriere[0];
      set({
        carriere,
        selectedMatId: get().selectedMatId ?? attiva?.matId ?? null,
        isInitialized: true,
      });
    } catch (err) {
      logger.error("[careerStore] Errore caricamento carriere:", err);
      set({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelected: (matId) => set({ selectedMatId: matId }),

  reset: () =>
    set({
      carriere: [],
      selectedMatId: null,
      isInitialized: false,
      error: null,
    }),
}));
