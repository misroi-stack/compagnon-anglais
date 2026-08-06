import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Délai au-delà duquel un appel Supabase est abandonné plutôt que de rester
 *  en attente indéfiniment (ex: réseau coupé sans erreur explicite du navigateur). */
const REQUEST_TIMEOUT_MS = 12_000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

export const supabase = createClient(url, publishableKey, {
  global: { fetch: fetchWithTimeout },
});
