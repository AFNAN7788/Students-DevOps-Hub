import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected to database");
  } catch (err) {
    console.error("❌ Prisma connection failed:", err.message);
    throw err;
  }
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}