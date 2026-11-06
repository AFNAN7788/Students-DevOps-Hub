-- ============================================================
-- profile-trigger.sql — keep the public."User" profile row in
-- sync with Supabase Auth (auth.users).
--
-- IMPORTANT: Prisma's default model table name is "User" and it
-- is created in the `public` schema. Run these statements in the
-- Supabase SQL editor (or psql) AFTER running Prisma migrations.
-- ============================================================

-- 1. Create a profile row whenever a user signs up through Supabase Auth.
--    - id mirrors auth.users.id (the Supabase Auth UUID)
--    - email mirrors auth.users.email
--    - name comes from auth.users.raw_user_meta_data->>'name' (set at signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = NEW.email,
        name = COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'name', ''),
          "User".name
        ),
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Keep the profile email in sync when the user updates their email in Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_user_email_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public."User"
  SET email = NEW.email,
      updated_at = now()
  WHERE id = NEW.id::text;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_updated();

-- 3. Clean up the profile row when the auth user is deleted.
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public."User" WHERE id = OLD.id::text;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deleted();
