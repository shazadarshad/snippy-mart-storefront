/**
 * Safely extracts human-readable error messages from Supabase Edge Functions or Fetch errors
 * without throwing "context.json is not a function" TypeErrors.
 */
export async function parseEdgeFunctionError(error: unknown): Promise<string> {
  if (!error) return 'An unexpected error occurred';
  if (typeof error === 'string') return error;

  const anyErr = error as any;

  // 1. Safe context parsing from FunctionsHttpError
  if (anyErr?.context) {
    try {
      if (typeof anyErr.context.json === 'function') {
        const body = await anyErr.context.json();
        const msg = body?.error || body?.message || body?.details;
        if (msg) return String(msg);
      } else if (typeof anyErr.context.text === 'function') {
        const txt = await anyErr.context.text();
        if (txt) {
          try {
            const parsed = JSON.parse(txt);
            const msg = parsed?.error || parsed?.message || parsed?.details;
            if (msg) return String(msg);
          } catch {
            if (txt.length < 200) return txt;
          }
        }
      }
    } catch {
      /* ignore context parse failure */
    }
  }

  // 2. Standard error message check
  if (anyErr?.message && typeof anyErr.message === 'string') {
    const msg = anyErr.message;
    // Don't leak raw internal TypeError string if it happened upstream
    if (msg.includes('context.json is not a function') || msg.includes('Failed to fetch')) {
      return 'Network request failed. Please check your internet connection and try again.';
    }
    return msg;
  }

  return 'Failed to complete request. Please try again.';
}
