import type { SupabaseClient } from "@supabase/supabase-js";

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