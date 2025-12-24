import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lwiedolkqdgddhpzpidi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aWVkb2xrcWRnZGRocHpwaWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzczMDYsImV4cCI6MjA4MDQ1MzMwNn0.hStBxAqCXs1gOsra85yWJ_lZEmUISEnI-W-N-ruAz1o';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Circuit Breaker State
let isCircuitOpen = false;

/**
 * A protected wrapper for Supabase calls that respects the circuit breaker.
 * If the circuit is open (network failed once), it returns a null-like response immediately
 * to prevent the browser from attempting a fetch and logging a red error.
 */
export const db = {
  async execute<T>(operation: () => Promise<{ data: T | null; error: any }>): Promise<T | null> {
    if (isCircuitOpen || !navigator.onLine) return null;

    try {
      const { data, error } = await operation();
      if (error) {
        // Only trip the circuit on actual network/fetch errors, not logic errors
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes('fetch') || error.status === 0 || error.status === 502) {
          isCircuitOpen = true;
          console.debug("ShadowGuard Circuit Breaker: Network failure detected. Switching to Local Mode.");
        }
        return null;
      }
      return data;
    } catch (e: any) {
      isCircuitOpen = true;
      console.debug("ShadowGuard Circuit Breaker: Caught fetch exception. Switching to Local Mode.");
      return null;
    }
  },
  
  isOffline: () => isCircuitOpen || !navigator.onLine
};

export const supabase = client;
