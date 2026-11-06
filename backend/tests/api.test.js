import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { getSupabaseAdminClient } from "../src/config/supabase.js";

// Integration tests run against real Supabase + Supabase Postgres.
// When credentials are absent the live describe block skips VISIBLY with reasons.

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

const describeIfDatabase = hasDatabase ? describe : describe.skip;
const itIfDatabase = hasDatabase ? it : it.skip;
const describeIfLive =
  hasSupabase && hasDatabase && hasServiceRole ? describe : describe.skip;

const skipReasons = [];
if (!hasSupabase) skipReasons.push("SUPABASE_URL/SUPABASE_ANON_KEY not set");
if (!hasDatabase) skipReasons.push("DATABASE_URL not set");
if (!hasServiceRole) skipReasons.push("SUPABASE_SERVICE_KEY not set (needed for confirmed test users)");

// Public endpoints — work without any credentials.
describe("public endpoints (no credentials needed)", () => {
  it("GET /api/unknown returns 404 envelope", async () => {
    const res = await request(app).get("/api/nope").expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(res.body.error.message).toBeTruthy();
  });

  it("POST /api/auth/login with invalid body returns 400 validation envelope", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it("POST /api/auth/signup rejects short passwords (400 VALIDATION_ERROR)", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "student@example.com", password: "short" })
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  itIfDatabase("GET /api/health reports database connectivity", async () => {
    const res = await request(app).get("/api/health");
    if (res.status === 200) {
      expect(res.body.body ?? res.body).toBeTruthy();
      expect(res.body.data.database).toBe("connected");
    } else {
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
    }
  });
});

// Live flow: admin API creates a pre-confirmed user (no email sending),
// then every endpoint is exercised through the real HTTP surface.
describeIfLive(`live auth + CRUD flow (skipped: ${skipReasons.join("; ")})`, () => {
  let admin;
  let env;
  let createdProjectId = null;

  beforeAll(async () => {
    admin = getSupabaseAdminClient();
    env = {
      email: `sdh-live-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`,
      password: "Test-Passw0rd!-sdh",
      access_token: null,
      refresh_token: null,
      userId: null,
    };

    const { data, error } = await admin.auth.admin.createUser({
      email: env.email,
      password: env.password,
      email_confirm: true,
      user_metadata: { name: "SDH Live Student" },
    });

    if (error) throw new Error(`admin.createUser failed: ${error.message}`);
    env.userId = data.user.id;
  }, 60000);

  afterAll(async () => {
    if (env?.userId && admin) {
      await admin.auth.admin.deleteUser(env.userId).catch(() => {});
    }
  }, 60000);

  it("POST /api/auth/signup returns envelope (201) or documents rate limits", async () => {
    const probeEmail = `sdh-signup-${Date.now()}@example.com`;
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        email: probeEmail,
        password: env.password,
        name: "Signup Probe",
      });

    // 201 = created (needsEmailVerification or tokens).
    // 409 = already exists. 429 = Supabase email rate limit on confirmation mail.
    expect([201, 409, 429]).toContain(res.status);
    expect(res.body.success).toBe(res.status === 201 ? true : false);

    if (res.status === 201) {
      const d = res.body.data;
      expect(typeof d.needsEmailVerification).toBe("boolean");
      if (d.needsEmailVerification) {
        expect(d.tokens).toBeNull();
      } else {
        expect(d.tokens.access_token).toBeTruthy();
      }

      // Clean up the probe account so repeated runs don't leave test data behind.
      if (d.user?.id) await admin.auth.admin.deleteUser(d.user.id).catch(() => {});
    } else {
      console.warn(
        `⚠️  signup probe returned ${res.status} (${res.body?.error?.code ?? "?"}) — likely Supabase email rate limit; envelope verified only.`
      );
    }
  }, 60000);

  it("POST /api/auth/login rejects a wrong password (401 INVALID_CREDENTIALS)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: env.email, password: "wrong-password" })
      .expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  }, 30000);

  it("POST /api/auth/login succeeds for a confirmed user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: env.email, password: env.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(env.email);
    expect(res.body.data.tokens.access_token).toBeTruthy();
    expect(res.body.data.tokens.refresh_token).toBeTruthy();

    env.access_token = res.body.data.tokens.access_token;
    env.refresh_token = res.body.data.tokens.refresh_token;
  }, 30000);

  it("GET /api/profile returns the profile row created by the trigger", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(200);

    expect(res.body.data.user.id).toBe(env.userId);
    expect(res.body.data.user.email).toBe(env.email);
    expect(res.body.data.user.name).toBe("SDH Live Student");
  }, 30000);

  it("PATCH /api/profile updates the display name", async () => {
    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${env.access_token}`)
      .send({ name: "SDH Renamed" })
      .expect(200);

    expect(res.body.data.user.name).toBe("SDH Renamed");
  }, 30000);

  it("GET /api/projects returns an empty paginated list for a new user", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.total).toBe(0);
  }, 30000);

  it("POST /api/projects creates a project (201 envelope)", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${env.access_token}`)
      .send({
        name: "Live Test Project",
        description: "Created by the integration suite",
        repo_url: "https://github.com/student/live-test-project",
        repo_owner: "student",
        repo_name: "live-test-project",
        default_branch: "main",
        language: "JavaScript",
        framework: "React",
        visibility: "private",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.owner_id).toBe(env.userId);
    createdProjectId = res.body.data.id;
  }, 30000);

  it("GET /api/projects/:id returns the project with counts", async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(200);

    expect(res.body.data.id).toBe(createdProjectId);
    expect(res.body.data.name).toBe("Live Test Project");
    expect(res.body.data._count).toBeTruthy();
    expect(Array.isArray(res.body.data.pipelines)).toBe(true);
    expect(Array.isArray(res.body.data.test_reports)).toBe(true);
    expect(Array.isArray(res.body.data.deployments)).toBe(true);
  }, 30000);

  it("GET /api/projects/dashboard reflects the new project", async () => {
    const res = await request(app)
      .get("/api/projects/dashboard")
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(200);

    expect(res.body.data.stats.totalProjects).toBe(1);
    expect(res.body.data.stats.activeProjects).toBe(1);
    expect(res.body.data.recentProjects.length).toBe(1);
  }, 30000);

  it("PATCH /api/projects/:id updates the project", async () => {
    const res = await request(app)
      .patch(`/api/projects/${createdProjectId}`)
      .set("Authorization", `Bearer ${env.access_token}`)
      .send({ name: "Live Test Project (renamed)", status: "archived" })
      .expect(200);

    expect(res.body.data.name).toBe("Live Test Project (renamed)");
    expect(res.body.data.status).toBe("archived");
  }, 30000);

  it("GET /api/projects/:id/pipelines returns an empty list (no webhooks yet)", async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}/pipelines`)
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(200);

    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.pagination.total).toBe(0);
  }, 30000);

  it("GET /api/projects/:id/tests returns the project's test report views", async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}/tests`)
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(200);

    expect(Array.isArray(res.body.data.test_reports)).toBe(true);
  }, 30000);

  it("GET /api/projects/:id with a foreign UUID → 404 PROJECT_NOT_FOUND", async () => {
    const res = await request(app)
      .get("/api/projects/00000000-0000-4000-8000-000000000001")
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(404);

    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  }, 30000);

  it("GET /api/projects/:id with a non-UUID → 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .get("/api/projects/not-a-uuid")
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(400);

    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  }, 30000);

  it("POST /api/auth/refresh rotates the session tokens", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refresh_token: env.refresh_token })
      .expect(200);

    expect(res.body.data.tokens.access_token).toBeTruthy();
    env.access_token = res.body.data.tokens.access_token;
    env.refresh_token = res.body.data.tokens.refresh_token;
  }, 30000);

  it("POST /api/auth/change-password updates the password after validating the current one", async () => {
    await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${env.access_token}`)
      .send({ current_password: "definitely-wrong", new_password: "BrandNew-Passw0rd!" })
      .expect(401);

    await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${env.access_token}`)
      .send({ current_password: env.password, new_password: "BrandNew-Passw0rd!" })
      .expect(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: env.email, password: "BrandNew-Passw0rd!" })
      .expect(200);

    env.access_token = login.body.data.tokens.access_token;
    env.refresh_token = login.body.data.tokens.refresh_token;
    env.password = "BrandNew-Passw0rd!";
  }, 60000);

  it("POST /api/auth/login before email confirmation → 403 EMAIL_NOT_VERIFIED", async () => {
    const email = `sdh-unverified-${Date.now()}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "Unverified-Passw0rd!",
      email_confirm: false,
    });
    expect(error).toBeNull();

    try {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "Unverified-Passw0rd!" })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
    } finally {
      if (data?.user?.id) await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
    }
  }, 60000);

  it("DELETE /api/projects/:id removes the project", async () => {
    const res = await request(app)
      .delete(`/api/projects/${createdProjectId}`)
      .set("Authorization", `Bearer ${env.access_token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    createdProjectId = null;
  }, 30000);

  it("POST /api/auth/logout succeeds", async () => {
    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${env.access_token}`)
      .send({ refresh_token: env.refresh_token })
      .expect(200);
  }, 30000);
});

// Token-guard semantics without credentials.
describe("route guards (no credentials needed)", () => {
  it("GET /api/projects without a token → 401 MISSING_TOKEN", async () => {
    const res = await request(app).get("/api/projects").expect(401);
    expect(res.body.error.code).toBe("MISSING_TOKEN");
  });

  it("GET /api/profile with a garbage token → 401 INVALID_TOKEN", async () => {
    if (!hasSupabase) return;
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", "Bearer not-a-real-token")
      .expect(401);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  }, 20000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
