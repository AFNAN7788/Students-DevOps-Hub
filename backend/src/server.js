import "dotenv/config";
import app from "./app.js";
import { prisma, disconnectPrisma } from "./config/prisma.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Student DevOps Hub API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});

// Verify the database is reachable in the background so /api/health can report it.
prisma
  .$queryRaw`SELECT 1`
  .then(() => console.log("✅ Prisma connected to database"))
  .catch((err) => {
    console.error(`⚠️  Database not reachable yet (${err.message}) — health endpoint will report 503 until it is.`);
  });

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down…`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
