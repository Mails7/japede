import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carrega as variáveis de ambiente
config();

console.log('[SupabaseClient] Initializing Supabase client for scripts...');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`[SupabaseClient] SUPABASE_URL from environment variables: ${supabaseUrl ? 'Loaded' : 'MISSING!'}`);
console.log(`[SupabaseClient] SUPABASE_ANON_KEY from environment variables: ${supabaseAnonKey ? 'Loaded' : 'MISSING!'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  const message = 'Supabase URL ou Anon Key não encontrados nas variáveis de ambiente. Verifique se o arquivo .env está configurado corretamente.';
  console.error(`[SupabaseClient] ERRO CRÍTICO: ${message}`);
  throw new Error(message);
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

console.log('[SupabaseClient] Cliente Supabase inicializado com sucesso para scripts.');

// Helper function to convert Supabase data (with potential single object response) to an array
export function getArray<T>(data: T | T[] | null): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}
