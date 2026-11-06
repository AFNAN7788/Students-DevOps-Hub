import * as authService from "../services/authService.js";
import { sendSuccess } from "../utils/errors.js";

// Never log raw email addresses (PII). Keep just enough for debugging.
function maskEmail(email) {
  if (typeof email !== "string" || !email.includes("@")) return "unknown";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function signupHandler(req, res, next) {
  try {
    const data = await authService.signup(req.body);
    res.locals.suppressLogging = true;
    const who = maskEmail(req.body?.email);
    res.locals.loggingMessage = data.needsEmailVerification
      ? `signup (needs email verification) ${who}`
      : `signup (confirmed) ${who}`;
    if (data.needsEmailVerification) console.log(`📬 Signup requires email verification: ${who}`);
    else console.log(`✅ Signup: ${who}`);
    return sendSuccess(res, data, 201);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const { user, tokens } = await authService.login(req.body);
    console.log(`✅ Login: ${maskEmail(user.email)}`);
    return sendSuccess(res, { user, tokens });
  } catch (err) {
    if (err?.statusCode !== 403) console.warn(`❌ Login failed: ${maskEmail(req.body?.email)} → ${err?.message}`);
    next(err);
  }
}

export async function refreshHandler(req, res, next) {
  try {
    const data = await authService.refreshSession(req.body);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req, res, next) {
  try {
    await authService.logout(req.token, {
      refresh_token: req.body?.refresh_token ?? undefined,
    });
    return sendSuccess(res, { message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.token);
    return sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(req, res, next) {
  try {
    const data = await authService.changePassword(req.token, req.body);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordHandler(req, res, next) {
  try {
    const data = await authService.forgotPassword(req.body);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    const data = await authService.resetPassword(req.body);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function resendVerificationHandler(req, res, next) {
  try {
    const data = await authService.resendVerification(req.body);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
