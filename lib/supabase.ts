
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase variables in Next.js execution.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  global: {
    // Overrides Next.js 14 patched fetch handler to disable stale data caching
    fetch: (url, options) =>
      fetch(url, {
        ...options,
        cache: 'no-store', // Guarantees fresh real-time database queries on Vercel
      }),
  },
});
