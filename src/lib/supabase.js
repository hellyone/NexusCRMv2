import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase server-side (uso em API routes / Server Actions).
 * Usa SUPABASE_SERVICE_ROLE_KEY para operações que bypassam RLS (ex: upload).
 * Só é inicializado se as variáveis estiverem definidas (Vercel + Supabase).
 */
function getSupabaseServer() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

export { getSupabaseServer };
