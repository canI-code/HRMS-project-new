import type { AuthState } from "./types";

const STORAGE_KEY = "own-hrms-auth";

export interface PersistedAuthState {
  user?: AuthState["user"];
  roles: AuthState["roles"];
  tokens?: AuthState["tokens"];
}

const isBrowser = typeof window !== "undefined";

export const loadAuthState = (): PersistedAuthState | undefined => {
  if (!isBrowser) return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedAuthState) : undefined;
  } catch {
    return undefined;
  }
};

export const persistAuthState = (state: PersistedAuthState) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore storage issues */
  }
};

export const clearAuthState = () => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore storage issues */
  }
};
