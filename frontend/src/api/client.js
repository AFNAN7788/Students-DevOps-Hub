// ─── The ONE service layer ───
// All network calls in the app happen through this module. Pages and components
// import `authApi` / `projectApi` — never raw fetch(), never inline axios.
//
// Backend response contract (implemented in Prompt 2):
//   success: { success: true,  data: { ...payload } }
//   failure: { success: false, error: { code, message, details? } }
// The response interceptor unwraps the envelope into `response.data`, so every
// page keeps reading `res.data.user`, `res.data.items`, etc.
import axios from "axios";
import {
  getSessionToken,
  getSessionRefreshToken,
  setSessionTokens,
  clearSession,
} from "./session.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach Bearer token from the session helper.
api.interceptors.request.use(
  (config) => {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor:
// 1. Unwrap the `{ success, data }` envelope so callers see the payload directly.
// 2. On 401, clear the session and redirect to /login (remembering the target).
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object" && "success" in response.data) {
      response.data = response.data.data ?? response.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.error?.code;
      // 401 from EMAIL_NOT_VERIFIED-style blocks only happens on 403, so any 401
      // here is a dead/expired session — safe to clear.
      clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        try {
          window.sessionStorage.setItem(
            "sdh_return_to",
            window.location.pathname + window.location.search
          );
        } catch {
          // storage unavailable — skip the return-after-login nicety
        }
        window.location.href = "/login";
      } else if (code) {
        error.response.data.error = { ...error.response.data.error };
      }
    }
    return Promise.reject(error);
  }
);

// Normalizes any axios/network error into a useful message for the UI.
export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (axios.isCancel(error)) return "Request cancelled.";
  if (!error.response) {
    return "Cannot reach the server. Check that the backend is running and try again.";
  }
  const data = error.response.data;
  const errPayload = data?.error;
  let message;

  if (errPayload && typeof errPayload === "object") {
    // Envelope failure: { error: { code, message, details? } }
    message = errPayload.message || fallback;
    const details = errPayload.details;
    if (Array.isArray(details) && details.length) {
      message = `${message} ${details.join(" ")}`.trim();
    }
  } else if (typeof errPayload === "string") {
    message = errPayload;
  } else {
    // Legacy shapes: { message }, Joi-style arrays, plain error strings
    message = data?.message || data?.error || error.message || fallback;
    if (Array.isArray(message)) message = message.join(" ");
  }

  return message || fallback;
}

// Machine-readable error code from the backend envelope (e.g. EMAIL_NOT_VERIFIED).
export function getApiErrorCode(error) {
  return error?.response?.data?.error?.code ?? null;
}

// Persist both tokens from a login/signup/refresh payload, same remember flag.
export function storeSession(tokens, { remember = true } = {}) {
  setSessionTokens(tokens, { remember });
}

export { clearSession, getSessionToken, getSessionRefreshToken };
export const setAuthToken = (token, options) => setSessionTokens(token, options);

// ─── Auth endpoints ───
export const authApi = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  logout: (data = {}) => api.post("/auth/logout", data),
  refresh: (data) => api.post("/auth/refresh", data),
  // GET /api/profile — session-derived user profile
  me: () => api.get("/profile"),
  // PATCH /api/profile — name / avatar_url updates
  updateProfile: (data) => api.patch("/profile", data),
  // POST /api/auth/change-password { current_password, new_password }
  changePassword: (data) => api.post("/auth/change-password", data),
  // POST /api/auth/forgot-password { email }
  requestPasswordReset: (data) => api.post("/auth/forgot-password", data),
  // POST /api/auth/reset-password { password, access_token, refresh_token }
  resetPassword: (data) => api.post("/auth/reset-password", data),
  // POST /api/auth/resend-verification { email }
  resendVerification: (data) => api.post("/auth/resend-verification", data),
  health: () => api.get("/health"),
};

// ─── Project endpoints ───
export const projectApi = {
  dashboard: () => api.get("/projects/dashboard"),
  list: (params = {}) => api.get("/projects", { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  pipelines: (id, params = {}) => api.get(`/projects/${id}/pipelines`, { params }),
  tests: (id) => api.get(`/projects/${id}/tests`),
  deployments: (id, params = {}) => api.get(`/projects/${id}/deployments`, { params }),
};

export default api;
