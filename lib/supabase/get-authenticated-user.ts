import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Wraps supabase.auth.getUser() with a couple of retries. Server actions
 * call this on nearly every request, and a single flaky network blip
 * between the server and Supabase (ETIMEDOUT, DNS hiccups, etc.) would
 * otherwise surface as "Not authenticated" even though the session is
 * completely fine. A genuinely logged-out user still fails after retries.
 */
export async function getAuthenticatedUser(supabase: SupabaseClient) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error) return data.user;
      lastError = error;
    } catch (error) {
      lastError = error;
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  console.error("Failed to get authenticated user after retries:", lastError);
  return null;
}