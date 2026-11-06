import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/client.js";
import { clearSession, getSessionToken, getSessionRefreshToken, setSessionTokens } from "../api/session.js";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (getSessionToken() ? "loading" : "anonymous"));
  const navigate = useNavigate();

  // Validate the stored token against the backend on load, via the service layer.
  useEffect(() => {
    let cancelled = false;
    if (!getSessionToken()) {
      setStatus("anonymous");
      return undefined;
    }
    (async () => {
      try {
        const res = await authApi.me();
        if (cancelled) return;
        setUser(res.data?.user || res.user || null);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        // clearSession has already dispatched auth:expired via the 401 interceptor;
        // for other failures (e.g. network) keep the token but let the UI show it.
        setUser(null);
        setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // React to session loss from anywhere (interceptor, sign-out, other tab).
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setStatus("anonymous");
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  // Store both tokens (access + refresh) with the chosen remember flag, then
  // load the session-derived profile so the header/settings never show a blank
  // user until a manual reload.
  // Accepts a payload like { access_token, refresh_token } or a plain token string.
  const login = useCallback(
    async (tokens, { remember = true } = {}) => {
      setSessionTokens(tokens, { remember });
      setStatus("authenticated");
      try {
        const res = await authApi.me();
        const next = res.data?.user || res.user || null;
        if (next) setUser(next);
      } catch {
        // Token is stored; pages that need the profile surface their own error.
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const refresh_token = getSessionRefreshToken();
      await authApi.logout({ ...(refresh_token ? { refresh_token } : {}) });
    } catch {
      // best-effort — network failure must not block sign-out
    }
    clearSession();
    setUser(null);
    setStatus("anonymous");
    navigate("/login", { replace: true });
  }, [navigate]);

  // Re-fetch the session user (after profile edits, for example).
  const refreshUser = useCallback(async () => {
    if (!getSessionToken()) return null;
    try {
      const res = await authApi.me();
      const next = res.data?.user || res.user || null;
      setUser(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      logout,
      refreshUser,
      isAuthenticated: status === "authenticated",
    }),
    [user, status, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider> (inside <BrowserRouter>).");
  return ctx;
}

// Session-flag based check used by route guards (anonymous = no stored token).
export function isAuthenticated() {
  return !!getSessionToken();
}
