// Single owner of the session tokens.
// All reading/writing/clearing of the auth session happens here — the axios
// client, useAuth, and useApi all delegate to these helpers.
// Storage contract:
//   "auth_token"       -> Supabase access token (JWT)
//   "sdh_refresh_token" -> Supabase refresh token (same storage as access)
// The same remember flag controls where BOTH tokens live:
//   remember=true  -> localStorage  (persistent session)
//   remember=false -> sessionStorage (session-scoped)

const TOKEN_KEY = "auth_token";
const REFRESH_KEY = "sdh_refresh_token";
const REMEMBER_KEY = "sdh_remember_session";

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // storage unavailable — nothing to clear
  }
}

function safeRemoveKey(key) {
  safeRemove(window.localStorage, key);
  safeRemove(window.sessionStorage, key);
}

// Reads from localStorage first (persistent session), falls back to
// sessionStorage (per-tab session when "Remember me" was unchecked).
export function getSessionToken() {
  return safeGet(window.localStorage, TOKEN_KEY) || safeGet(window.sessionStorage, TOKEN_KEY);
}

export function getSessionRefreshToken() {
  return safeGet(window.localStorage, REFRESH_KEY) || safeGet(window.sessionStorage, REFRESH_KEY);
}

export function isSessionPersistent() {
  return safeGet(window.localStorage, REMEMBER_KEY) === "true";
}

// Writes both tokens to the storage implied by `remember`:
// remember=true  -> localStorage  (true persistent session)
// remember=false -> sessionStorage (session-scoped)
// tokens may be a plain string (access only) or a shape like
// { access_token, refresh_token } straight from the backend envelope.
export function setSessionTokens(tokens, { remember = true } = {}) {
  try {
    const access =
      typeof tokens === "string" ? tokens : tokens?.access_token || tokens?.token || null;
    const refresh =
      typeof tokens === "string" ? null : tokens?.refresh_token || null;

    safeRemoveKey(TOKEN_KEY);
    safeRemoveKey(REFRESH_KEY);
    safeRemoveKey(REMEMBER_KEY);

    if (access) {
      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem(TOKEN_KEY, access);
      if (refresh) {
        storage.setItem(REFRESH_KEY, refresh);
      }
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, "true");
      }
    }
  } catch {
    // storage unavailable — session simply won't persist
  }
}

// Back-compat alias used by older call sites.
export const setSessionToken = setSessionTokens;

// Clears the tokens and remembers nothing; a distinct event lets the auth
// context and any listeners react to session loss (route guards, UI, etc.).
export function clearSession() {
  safeRemoveKey(TOKEN_KEY);
  safeRemoveKey(REFRESH_KEY);
  safeRemoveKey(REMEMBER_KEY);
  window.dispatchEvent(new Event("auth:expired"));
}
