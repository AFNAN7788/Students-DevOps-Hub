-- ============================================================
-- rls.sql — row level security for the public tables used by
-- the Student DevOps Hub.
--
-- The Express API is the primary data gate (it authenticates every
-- request against Supabase Auth and scopes every query by owner_id).
-- RLS here is a second layer of defense for direct database access
-- (Supabase "PostgREST" endpoints, SQL editors with anon JWT, etc.).
--
-- Rationale per table:
--   "User"         anon: none. authenticated users: read/update OWN row.
--   "Project"      anon: none. authenticated users: read/update/delete OWN rows.
--   "PipelineRun"  anon: none. authenticated users: read/update OWN rows
--                  (via project owner). Writes happen with the service role
--                  (webhooks) or through the API, so INSERT stays closed.
--   "TestReport"   anon: none. authenticated users: read OWN rows.
--                  Writes happen with the service role (webhooks) or via API.
--   "Deployment"   anon: read: none. authenticated users: read OWN rows.
--                  Writes happen with the service role (webhooks) or via API.
-- ============================================================

ALTER TABLE public."User"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Project"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PipelineRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TestReport"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Deployment"  ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------
-- public."User"
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "users_read_own_profile"  ON public."User";
DROP POLICY IF EXISTS "users_update_own_profile" ON public."User";

CREATE POLICY "users_read_own_profile"
  ON public."User" FOR SELECT
  TO authenticated
  USING ((auth.uid())::text = id);

CREATE POLICY "users_update_own_profile"
  ON public."User" FOR UPDATE
  TO authenticated
  USING ((auth.uid())::text = id)
  WITH CHECK ((auth.uid())::text = id AND (auth.uid())::text = id);

-- ------------------------------------------------------------------
-- public."Project" — owner sees all of their rows; rows stay owner-scoped.
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "projects_owner_all" ON public."Project";

CREATE POLICY "projects_owner_all"
  ON public."Project" FOR ALL
  TO authenticated
  USING ((auth.uid())::text = owner_id)
  WITH CHECK ((auth.uid())::text = owner_id);

-- ------------------------------------------------------------------
-- public."PipelineRun" — readable through owner join; webhooks write
-- with the service role which bypasses RLS.
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "pipelines_owner_read" ON public."PipelineRun";
DROP POLICY IF EXISTS "pipelines_owner_update" ON public."PipelineRun";

CREATE POLICY "pipelines_owner_read"
  ON public."PipelineRun" FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public."Project" p
    WHERE p.id = "PipelineRun".project_id
      AND p.owner_id = (auth.uid())::text
  ));

CREATE POLICY "pipelines_owner_update"
  ON public."PipelineRun" FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public."Project" p
    WHERE p.id = "PipelineRun".project_id
      AND p.owner_id = (auth.uid())::text
  ));

-- ------------------------------------------------------------------
-- public."TestReport" — readable through owner join.
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "test_reports_owner_read" ON public."TestReport";

CREATE POLICY "test_reports_owner_read"
  ON public."TestReport" FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public."Project" p
    WHERE p.id = "TestReport".project_id
      AND p.owner_id = (auth.uid())::text
  ));

-- ------------------------------------------------------------------
-- public."Deployment" — readable through owner join.
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "deployments_owner_read" ON public."Deployment";

CREATE POLICY "deployments_owner_read"
  ON public."Deployment" FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public."Project" p
    WHERE p.id = "Deployment".project_id
      AND p.owner_id = (auth.uid())::text
  ));
