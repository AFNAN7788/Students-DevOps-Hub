import { useCallback, useState } from "react";
import api, { getApiErrorMessage, authApi } from "../api/client.js";
import { clearSession, getSessionToken } from "../api/session.js";

// Standalone logout: clears the session locally and notifies the backend
// on a best-effort basis (network failure must not block sign-out).
export async function performLogout() {
  try {
    if (getSessionToken()) await authApi.logout();
  } catch {
    // best-effort — swallow
  }
  clearSession();
}

// Tiny wrapper around the service layer that tracks loading/error per key.
export function useApi() {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  const request = useCallback(async (method, url, data = null) => {
    const key = `${method}:${url}`;
    setLoading((prev) => ({ ...prev, [key]: true }));
    setError((prev) => ({ ...prev, [key]: null }));

    try {
      const response = await api({ method, url, ...(data !== null ? { data } : {}) });
      return response.data ?? response;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError((prev) => ({ ...prev, [key]: message }));
      throw new Error(message);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  const get = (url) => request("get", url);
  const post = (url, data) => request("post", url, data);
  const put = (url, data) => request("put", url, data);
  const patch = (url, data) => request("patch", url, data);
  const del = (url) => request("delete", url);

  const resetError = (key) => setError((prev) => ({ ...prev, [key]: null }));

  const logout = async () => {
    await performLogout();
  };

  return { loading, error, resetError, request, get, post, put, patch, del, logout };
}
