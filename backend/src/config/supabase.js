import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️  Supabase credentials not fully configured (SUPABASE_URL / SUPABASE_ANON_KEY)"
  );
}

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
};

export function getSupabaseClient() {
  return createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "", clientOptions);
}

export function getSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, clientOptions);
}

export function createUserClient(accessToken) {
  return createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "", {
    ...clientOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

const TOKEN_CACHE_TTL_MS = 60 * 1000;
const tokenCache = new Map();

export function clearTokenCache() {
  tokenCache.clear();
}

export async function verifyAccessToken(token) {
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.verifiedAt < TOKEN_CACHE_TTL_MS) {
    return cached.payload;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return null;
  }

  const payload = { ...data.user, verifiedAt: Date.now() };
  tokenCache.set(token, { verifiedAt: Date.now(), payload });
  return payload;
}
