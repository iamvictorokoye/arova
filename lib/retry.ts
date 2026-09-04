/**
 * Retries an async operation a few times with a short backoff. Used for
 * calls to third-party APIs (Stream, Supabase) where a transient network
 * blip shouldn't take down a whole feature — only a call that's still
 * failing after several attempts is treated as a real error.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, delayMs = 300, label }: { attempts?: number; delayMs?: number; label?: string } = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (label) {
        console.error(`${label} failed (attempt ${attempt + 1}/${attempts}):`, error);
      }
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}