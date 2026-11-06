import { prisma } from "../config/prisma.js";
import {
  getSupabaseClient,
  createUserClient,
  clearTokenCache,
  verifyAccessToken,
} from "../config/supabase.js";
import { AppError } from "../utils/errors.js";

function handleSupabaseError(error) {
  if (!error) return null;

  const message = error.message || "Unexpected Supabase error";
  const status = error.status || error.statusCode || 400;
  const lower = message.toLowerCase();

  if (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed") ||
    error.code === "email_not_confirmed"
  ) {
    return new AppError(
      "Please verify your email address before logging in. Check your inbox for the verification link.",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  if (status === 429 || lower.includes("rate limit") || lower.includes("too many requests")) {
    return new AppError(
      "Too many attempts right now. Please wait a minute and try again.",
      429,
      "RATE_LIMITED"
    );
  }

  if (
    message.includes("already registered") ||
    message.includes("User already registered") ||
    message.includes("email address")
  ) {
    return new AppError(
      "An account with this email already exists.",
      409,
      "EMAIL_EXISTS"
    );
  }

  if (
    lower.includes("invalid token") ||
    lower.includes("invalid refresh token") ||
    lower.includes("session missing") ||
    lower.includes("session not found")
  ) {
    return new AppError(
      "Invalid or expired token. Please log in again.",
      401,
      "INVALID_TOKEN"
    );
  }

  if (message.includes("Invalid login credentials") || status === 400) {
    return new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  if (status === 401) {
    return new AppError(
      "Invalid or expired token. Please log in again.",
      401,
      "INVALID_TOKEN"
    );
  }

  if (status === 422) {
    return new AppError(message, 422, "UNPROCESSABLE", { detail: message });
  }

  return new AppError(message, status >= 500 ? 502 : status, "SUPABASE_ERROR", {
    detail: message,
  });
}

function publicUser(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? null,
    avatar_url: profile.avatar_url ?? null,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

function tokensOf(session) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    token_type: session.token_type,
  };
}

async function ensureProfileRow(supabaseUser, extraName = null) {
  if (!supabaseUser) {
    throw new AppError("Supabase did not return a user.", 500, "SUPABASE_ERROR");
  }

  const id = supabaseUser.id;
  const email = supabaseUser.email ?? null;
  const name =
    extraName ?? (supabaseUser.user_metadata?.name || null);

  return prisma.user.upsert({
    where: { id },
    update: { ...(name ? { name } : {}) },
    create: { ...(email ? { email } : {}), id, name },
  }).catch(async () => {
    const profile = await prisma.user.findUnique({ where: { id } });
    if (profile) return profile;
    throw new AppError(
      "Profile record could not be created.",
      500,
      "PROFILE_CREATE_FAILED"
    );
  });
}

export async function signup({ email, password, name }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || null } },
  });

  const mapped = handleSupabaseError(error);
  if (mapped) throw mapped;

  if (!data?.user) {
    throw new AppError("Signup failed. Please try again.", 500, "SIGNUP_FAILED");
  }

  const profile = await ensureProfileRow(data.user, name || null);

  // Supabase reports confirmation via confirmed_at (older projects) or
  // email_confirmed_at; when confirmations are disabled it may only set the
  // latter. A session alone also implies the account can sign in.
  const needsEmailVerification = !data.session
    ? true
    : !(data.user.confirmed_at || data.user.email_confirmed_at);

  return {
    user: publicUser(profile),
    tokens: tokensOf(data.session),
    needsEmailVerification,
  };
}

export async function login({ email, password }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const mapped = handleSupabaseError(error);
  if (mapped) throw mapped;

  if (!data?.user || !data?.session) {
    throw new AppError("Login failed. Please try again.", 500, "LOGIN_FAILED");
  }

  if (!data.user.confirmed_at && !data.user.email_confirmed_at) {
    throw new AppError(
      "Please verify your email address before logging in. Check your inbox for the verification link.",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  const profile = await ensureProfileRow(data.user);

  return {
    user: publicUser(profile),
    tokens: tokensOf(data.session),
  };
}

export async function refreshSession({ refresh_token }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token,
  });

  const mapped = handleSupabaseError(error);
  if (mapped) throw mapped;

  if (!data?.session || !data?.user) {
    throw new AppError(
      "Session expired. Please log in again.",
      401,
      "SESSION_EXPIRED"
    );
  }

  const profile = await ensureProfileRow(data.user);

  return {
    user: publicUser(profile),
    tokens: tokensOf(data.session),
  };
}

export async function logout(token, { refresh_token } = {}) {
  const userClient = createUserClient(token);
  await userClient.auth.signOut({
    refresh_token: refresh_token || undefined,
    scope: "local",
  });

  clearTokenCache();
  return { logged_out: true };
}

export async function getCurrentUser(token) {
  const supabaseUser = await verifyAccessToken(token);
  if (!supabaseUser) {
    throw new AppError(
      "Invalid or expired token. Please log in again.",
      401,
      "INVALID_TOKEN"
    );
  }

  const profile = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!profile) {
    throw new AppError(
      "Authentication succeeded but no user profile exists. Contact an administrator.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return publicUser(profile);
}

export async function changePassword(token, { current_password, new_password }) {
  const userClient = createUserClient(token);
  const { data, error } = await userClient.auth.getUser(token);

  const mapped = handleSupabaseError(error);
  if (mapped) throw mapped;

  const authUser = data?.user;
  if (!authUser) {
    throw new AppError(
      "Could not verify identity before password change.",
      401,
      "INVALID_TOKEN"
    );
  }

  if (authUser.email) {
    // Validate the current password by signing in with the anon client.
    // The returned in-memory session also authenticates the subsequent
    // updateUser call (a header-only client has no session to update).
    const passwordClient = getSupabaseClient();
    const { error: signInError } = await passwordClient.auth.signInWithPassword({
      email: authUser.email,
      password: current_password,
    });

    if (signInError) {
      const signInMapped = handleSupabaseError(signInError);
      if (signInMapped && signInMapped.statusCode !== 401) throw signInMapped;
      throw new AppError(
        "Current password is incorrect.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const { error: updateError } = await passwordClient.auth.updateUser({
      password: new_password,
    });

    const updateMapped = handleSupabaseError(updateError);
    if (updateMapped) throw updateMapped;

    // End the throwaway session used for the password change.
    await passwordClient.auth.signOut({ scope: "local" }).catch(() => {});

    return { password_changed: true };
  }

  // Very unusual: Supabase user without an email (e.g. phone-only). Fall back
  // to a session-less update attempt and surface any Supabase error.
  const { error: updateError } = await userClient.auth.updateUser({
    password: new_password,
  });

  const updateMapped = handleSupabaseError(updateError);
  if (updateMapped) throw updateMapped;

  return { password_changed: true };
}

export async function forgotPassword({ email }) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password`,
  });

  if (error) {
    const lower = (error.message || "").toLowerCase();

    // Supabase rejects clearly-invalid addresses; that is a validation problem,
    // not an authentication failure.
    if (error.code === "email_address_invalid" || lower.includes("is invalid")) {
      throw new AppError("Enter a valid email address.", 400, "VALIDATION_ERROR");
    }

    // Rate limiting is surfaced; anything else is swallowed so the endpoint
    // never reveals whether an account exists (Supabase already returns
    // success for unknown addresses).
    if (error.status === 429 || lower.includes("rate limit") || lower.includes("too many")) {
      throw new AppError(
        "Too many attempts right now. Please wait a minute and try again.",
        429,
        "RATE_LIMITED"
      );
    }
  }

  return { sent: true };
}

export async function resetPassword({ password, access_token, refresh_token }) {
  const userClient = createUserClient(access_token);

  const { error: sessionError } = await userClient.auth.setSession({
    access_token,
    refresh_token,
  });

  const sessionMapped = handleSupabaseError(sessionError);
  if (sessionMapped) throw sessionMapped;

  const { error } = await userClient.auth.updateUser({ password });
  const mapped = handleSupabaseError(error);
  if (mapped) throw mapped;

  await userClient.auth.signOut({ scope: "local" });
  return { password_reset: true };
}

export async function resendVerification({ email }) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    const mapped = handleSupabaseError(error);
    if (mapped?.statusCode === 400) {
      return { sent: true };
    }
    throw mapped ?? new AppError("Failed to resend verification.", 500, "SUPABASE_ERROR");
  }

  return { sent: true };
}
