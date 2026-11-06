import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../config/supabase.js";

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new AppError("Authentication required. Please log in.", 401, "MISSING_TOKEN")
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return next(
      new AppError("Authentication failed. Invalid token format.", 401, "INVALID_TOKEN")
    );
  }

  try {
    const user = await verifyAccessToken(token);

    if (!user) {
      return next(
        new AppError("Invalid or expired token. Please log in again.", 401, "INVALID_TOKEN")
      );
    }

    req.userId = user.id;
    req.userEmail = user.email ?? null;
    req.token = token;
    next();
  } catch (err) {
    next(
      new AppError(
        "Authentication failed. Please log in again.",
        401,
        "INVALID_TOKEN",
        { detail: err?.message ?? null }
      )
    );
  }
}
