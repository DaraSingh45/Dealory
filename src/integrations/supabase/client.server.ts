import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const USER_SUPABASE_URL = 'Your_supabase_project_url';

function createSupabaseAdminClient() {
  const SERVICE_ROLE_KEY = process.env.USER_SUPABASE_SERVICE_ROLE_KEY;

  if (!SERVICE_ROLE_KEY) {
    const message = `Missing USER_SUPABASE_SERVICE_ROLE_KEY secret.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(USER_SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
