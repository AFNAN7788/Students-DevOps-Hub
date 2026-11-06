export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isAppError = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function sendError(res, statusCode, code, message, details = null) {
  const body = {
    success: false,
    error: {
      code,
      message,
      ...(details != null && { details }),
    },
  };
  return res.status(statusCode).json(body);
}

export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function notFound(req, res, next) {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND"
    )
  );
}

export function globalErrorHandler(err, req, res, _next) {
  if (err.isAppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err.isJoi) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Invalid request data.",
      err.details.map((d) => d.message)
    );
  }

  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") {
    return sendError(res, err.type === "entity.too.large" ? 413 : 400, "BAD_REQUEST", "Invalid request body.");
  }

  if (err.code === "P2002") {
    return sendError(res, 409, "DUPLICATE_RECORD", "A record with this value already exists.");
  }
  if (err.code === "P2025") {
    return sendError(res, 404, "RECORD_NOT_FOUND", "The requested record was not found.");
  }
  if (typeof err.code === "string" && err.code.startsWith("P")) {
    const message =
      process.env.NODE_ENV === "production"
        ? "A database error occurred."
        : "A database error occurred.";
    return sendError(res, 400, "DATABASE_ERROR", message);
  }

  if (err.name === "AuthApiError" && err.status === 401) {
    return sendError(res, 401, "INVALID_TOKEN", "Invalid or expired session.");
  }

  if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
    return sendError(res, 401, "INVALID_TOKEN", "Invalid or expired token.");
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";
  return sendError(res, statusCode, err.code || "INTERNAL_ERROR", message);
}
