import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { prisma } from "./config/prisma.js";
import { globalErrorHandler, notFound, sendSuccess, sendError } from "./utils/errors.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import projectRoutes from "./routes/projects.js";

dotenv.config();

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS — restricted to the configured frontend origin
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = Array.from(
  new Set([clientUrl, "http://localhost:5173"])
);

app.use(
  cors({
    origin(origin, callback) {
      // Server-to-server and tools without Origin header are allowed.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check (public — no auth needed)
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, {
      status: "ok",
      service: "student-devops-hub",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return sendError(
      res,
      503,
      "SERVICE_UNAVAILABLE",
      "Database connection failed.",
      { database: "disconnected" }
    );
  }
});

// Application routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);

// 404 + error handlers
app.use(notFound);
app.use(globalErrorHandler);

export default app;
