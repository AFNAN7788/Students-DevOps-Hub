import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { getSupabaseAdminClient } from "../src/config/supabase.js";

// Ownership / authorization audit suite.
// Runs against the real Supabase project only when credentials exist; creates
// two throwaway confirmed users and deletes them afterwards. Existing rows are
// never read, modified, or deleted.

const hasSupabase =
  Boolean(process.env.SUPABASE_URL) &&
  typeof process.env.SUPABASE_ANON_KEY === "string" &&
  !process.env.SUPABASE_ANON_KEY.includes("PLACEHOLDER");
const hasDatabase = Boolean(
  process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("PLACEHOLDER")
);
const hasServiceRole =
  Boolean(process.env.SUPABASE_SERVICE_KEY) &&
  !String(process.env.SUPABASE_SERVICE_KEY).includes("PLACEHOLDER");

const describeIfLive =
  hasSupabase && hasDatabase && hasServiceRole ? describe : describe.skip;

const skipReasons = [];
if (!hasSupabase) skipReasons.push("SUPABASE creds missing");
if (!hasDatabase) skipReasons.push("DATABASE_URL missing");
if (!hasServiceRole) skipReasons.push("SUPABASE_SERVICE_KEY missing");

const password = "Ownership-Passw0rd!";

describeIfLive(`authorization & ownership (skipped: ${skipReasons.join("; ")})`, () => {
  const admin = getSupabaseAdminClient();
  const stamp = Date.now();
  const userA = { email: `sdh-owner-a-${stamp}@example.com`, id: null, token: null };
  const userB = { email: `sdh-owner-b-${stamp}@example.com`, id: null, token: null };
  let projectId = null;

  async function createUser(user, name) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw new Error(`createUser ${user.email}: ${error.message}`);
    user.id = data.user.id;
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password })
      .expect(200);
    user.token = login.body.data.tokens.access_token;
  }

  beforeAll(async () => {
    await createUser(userA, "Owner A");
    await createUser(userB, "Owner B");
  }, 90000);

  afterAll(async () => {
    for (const id of [userA.id, userB.id]) {
      if (id) await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  }, 90000);

  it("user A creates a project owned by A", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        name: "A's private project",
        repo_url: "https://github.com/owner-a/private-repo",
        repo_owner: "owner-a",
        repo_name: "private-repo",
      })
      .expect(201);

    expect(res.body.data.owner_id).toBe(userA.id);
    projectId = res.body.data.id;
  }, 30000);

  it("user B's project list does not include A's project", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${userB.token}`)
      .expect(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.pagination.total).toBe(0);
  }, 30000);

  it("user B cannot read A's project by ID (404, no existence leak)", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .expect(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
    expect(JSON.stringify(res.body)).not.toContain("A's private project");
  }, 30000);

  it("user B cannot read A's pipelines/deployments/tests", async () => {
    for (const path of ["pipelines", "deployments", "tests"]) {
      const res = await request(app)
        .get(`/api/projects/${projectId}/${path}`)
        .set("Authorization", `Bearer ${userB.token}`)
        .expect(404);
      expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
    }
  }, 30000);

  it("user B cannot update A's project (404, data unchanged)", async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ name: "Hijacked" })
      .expect(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");

    const check = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${userA.token}`)
      .expect(200);
    expect(check.body.data.name).toBe("A's private project");
  }, 30000);

  it("user B cannot delete A's project (404, project still exists)", async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .expect(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");

    await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${userA.token}`)
      .expect(200);
  }, 30000);

  it("owner_id in the request body is ignored (unknown field stripped)", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${userB.token}`)
      .send({
        name: "B project",
        owner_id: userA.id,
        id: "11111111-1111-4111-8111-111111111111",
      })
      .expect(201);

    expect(res.body.data.owner_id).toBe(userB.id);
    expect(res.body.data.id).not.toBe("11111111-1111-4111-8111-111111111111");
  }, 30000);

  it("invalid create payloads produce 400 VALIDATION_ERROR", async () => {
    const cases = [
      {},
      { name: "" },
      { name: "X", visibility: "secret" },
      { name: "X", repo_url: "not-a-url" },
    ];
    for (const payload of cases) {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${userB.token}`)
        .send(payload)
        .expect(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  }, 60000);

  it("unsafe list query parameters are rejected (400)", async () => {
    for (const query of ["limit=500", "page=0", "sort=owner_id", "order=sideways"]) {
      const res = await request(app)
        .get(`/api/projects?${query}`)
        .set("Authorization", `Bearer ${userB.token}`)
        .expect(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  }, 60000);

  it("forgot-password does not reveal whether an account exists", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: `sdh-missing-${stamp}@gmail.com` });
    // 200 for unknown accounts (no enumeration); 429 if Supabase rate limits.
    expect([200, 429]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.sent).toBe(true);
    }
  }, 30000);

  it("reset-password with garbage tokens fails safely (4xx envelope)", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        password: "Another-Passw0rd!",
        access_token: "garbage-access-token",
        refresh_token: "garbage-refresh-token",
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBeTruthy();
  }, 30000);

  it("refresh with a garbage token fails safely (4xx envelope)", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refresh_token: "garbage-refresh-token" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.body.success).toBe(false);
  }, 30000);

  it("the owner can still use the project after all attempts", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${userA.token}`)
      .expect(200);
    expect(res.body.data.id).toBe(projectId);
  }, 30000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
