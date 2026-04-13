import { create } from "zustand";
import { deriveAuth, generatePassphrase, type Credentials } from "@/lib/identity";
import { storage } from "@/lib/kv-storage";

const PASSPHRASE_KEY = "pulses_passphrase";
const DISPLAY_NAME_KEY = "pulses_display_name";
const SERVER_URL_KEY = "pulses_server_url";

const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_SYNC_URL ?? "http://localhost:8787/v1";

interface AuthState {
  passphrase: string | null;
  userId: string | null;
  authToken: string | null;
  encryptionSecret: string | null;
  displayName: string;
  serverUrl: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  /** Load persisted credentials on app start */
  loadPersistedAuth(): Promise<void>;
  /** Generate a new passphrase and derive credentials */
  createIdentity(displayName: string): Promise<void>;
  /** Log in with an existing passphrase */
  login(passphrase: string, displayName?: string): Promise<void>;
  /** Update display name */
  setDisplayName(name: string): Promise<void>;
  /** Update server URL */
  setServerUrl(url: string): Promise<void>;
  /** Clear all credentials */
  logout(): Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  passphrase: null,
  userId: null,
  authToken: null,
  encryptionSecret: null,
  displayName: "",
  serverUrl: DEFAULT_SERVER_URL,
  isAuthenticated: false,
  isLoading: true,

  async loadPersistedAuth() {
    const [savedPassphrase, savedDisplayName, savedServerUrl] =
      await Promise.all([
        storage.getItem(PASSPHRASE_KEY),
        storage.getItem(DISPLAY_NAME_KEY),
        storage.getItem(SERVER_URL_KEY),
      ]);

    if (savedPassphrase) {
      const creds = await deriveAuth(savedPassphrase);
      set({
        ...creds,
        displayName: savedDisplayName ?? "Me",
        serverUrl: savedServerUrl ?? DEFAULT_SERVER_URL,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  async createIdentity(displayName: string) {
    const passphrase = generatePassphrase();
    const creds = await deriveAuth(passphrase);
    await Promise.all([
      storage.setItem(PASSPHRASE_KEY, passphrase),
      storage.setItem(DISPLAY_NAME_KEY, displayName || "Me"),
    ]);
    set({
      ...creds,
      displayName: displayName || "Me",
      isAuthenticated: true,
    });
  },

  async login(passphrase: string, displayName?: string) {
    const creds = await deriveAuth(passphrase);
    const resolvedName = displayName ?? (await storage.getItem(DISPLAY_NAME_KEY)) ?? "Me";
    await Promise.all([
      storage.setItem(PASSPHRASE_KEY, passphrase),
      storage.setItem(DISPLAY_NAME_KEY, resolvedName),
    ]);
    set({ ...creds, displayName: resolvedName, isAuthenticated: true });
  },

  async setDisplayName(name: string) {
    await storage.setItem(DISPLAY_NAME_KEY, name);
    set({ displayName: name });
  },

  async setServerUrl(url: string) {
    await storage.setItem(SERVER_URL_KEY, url);
    set({ serverUrl: url });
  },

  async logout() {
    await Promise.all([
      storage.removeItem(PASSPHRASE_KEY),
      storage.removeItem(DISPLAY_NAME_KEY),
    ]);
    set({
      passphrase: null,
      userId: null,
      authToken: null,
      encryptionSecret: null,
      displayName: "",
      isAuthenticated: false,
    });
  },
}));
