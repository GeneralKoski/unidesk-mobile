import { Esse3Client } from "@/src/api/unidesk/esse3";
import { resetElly } from "@/src/api/unidesk/elly";
import { STORAGE_KEYS } from "@/src/consts";
import { logger } from "@/src/utils/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";

// Storage cross-platform: SecureStore su mobile, localStorage su web.
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

interface AuthStore {
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;

  user: string | null; // email Unipr
  matricola: string | null;
  firstName: string | null;
  lastName: string | null;

  _user: string | null;
  _pass: string | null;

  initialize: () => Promise<void>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  getCreds: () => { user: string; pass: string } | null;
  getEsse3: () => Esse3Client | null;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  user: null,
  matricola: null,
  firstName: null,
  lastName: null,
  _user: null,
  _pass: null,

  initialize: async () => {
    try {
      // Su iOS il Keychain sopravvive alla disinstallazione: AsyncStorage
      // (che invece si azzera) fa da flag per pulire i dati di una nuova install.
      if (Platform.OS === "ios") {
        const hasLaunched = await AsyncStorage.getItem(
          STORAGE_KEYS.FIRST_LAUNCH,
        );
        if (!hasLaunched) {
          await storage.remove(STORAGE_KEYS.UNIPR_USER);
          await storage.remove(STORAGE_KEYS.UNIPR_PASS);
          await storage.remove(STORAGE_KEYS.MATRICOLA);
          await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, "true");
        }
      }

      const user = await storage.get(STORAGE_KEYS.UNIPR_USER);
      const pass = await storage.get(STORAGE_KEYS.UNIPR_PASS);
      const matricola = await storage.get(STORAGE_KEYS.MATRICOLA);

      set({
        isAuthenticated: !!(user && pass),
        isInitialized: true,
        user,
        matricola,
        _user: user,
        _pass: pass,
      });
    } catch (error) {
      logger.error("[authStore] Errore inizializzazione:", error);
      set({ isInitialized: true, isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      // Valida le credenziali contro Esse3 e recupera nome + matricola attiva.
      const resp = await new Esse3Client(email, password).login();
      const tratti = resp.user.trattiCarriera ?? [];
      const attiva = tratti.find((t) => t.staStuCod === "A") ?? tratti[0];
      const matricola = attiva?.matricola ?? null;

      await storage.set(STORAGE_KEYS.UNIPR_USER, email);
      await storage.set(STORAGE_KEYS.UNIPR_PASS, password);
      if (matricola) await storage.set(STORAGE_KEYS.MATRICOLA, matricola);

      set({
        isAuthenticated: true,
        user: email,
        matricola,
        firstName: resp.user.firstName ?? null,
        lastName: resp.user.lastName ?? null,
        _user: email,
        _pass: password,
      });
      return { ok: true };
    } catch (err) {
      logger.error("[authStore] Login fallito:", err);
      return { ok: false, error: "Credenziali non valide." };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await storage.remove(STORAGE_KEYS.UNIPR_USER);
    await storage.remove(STORAGE_KEYS.UNIPR_PASS);
    await storage.remove(STORAGE_KEYS.MATRICOLA);
    resetElly();
    set({
      isAuthenticated: false,
      user: null,
      matricola: null,
      firstName: null,
      lastName: null,
      _user: null,
      _pass: null,
    });
  },

  getCreds: () => {
    const { _user, _pass } = get();
    return _user && _pass ? { user: _user, pass: _pass } : null;
  },

  getEsse3: () => {
    const { _user, _pass } = get();
    return _user && _pass ? new Esse3Client(_user, _pass) : null;
  },
}));
