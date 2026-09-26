import type { Database } from './database.types';
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

export async function createClient({ writableCookies = false } = {}) {
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        // Only Server Actions and Route Handlers may write cookies.
        if (!writableCookies) return;
        values.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
