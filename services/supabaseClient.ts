
import { createClient, SupabaseClient } from '@supabase/supabase-js';

console.log('[SupabaseClient] Initializing Supabase client...');

// IMPORTANT: These values are hardcoded based on your request for this specific AI interaction.
// In a real-world application, these MUST come from environment variables
// (e.g., process.env.REACT_APP_SUPABASE_URL or window._env_.SUPABASE_URL if injected at runtime).
// DO NOT commit hardcoded keys to your repository.
const supabaseUrl = (window as any).SUPABASE_URL;
const supabaseAnonKey = (window as any).SUPABASE_ANON_KEY;

console.log(`[SupabaseClient] SUPABASE_URL from window: ${supabaseUrl ? 'Loaded' : 'MISSING!'}`);
console.log(`[SupabaseClient] SUPABASE_ANON_KEY from window: ${supabaseAnonKey ? 'Loaded' : 'MISSING!'}`);


if (!supabaseUrl || !supabaseAnonKey) {
  const message = 'Supabase URL or Anon Key is missing from window object. Cannot initialize Supabase client. Ensure window.SUPABASE_URL and window.SUPABASE_ANON_KEY are set in index.html before this script runs.';
  console.error(`[SupabaseClient] CRITICAL ERROR: ${message}`);
  alert(message); 
  throw new Error(message);
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
console.log('[SupabaseClient] Supabase client instance created.');

// Helper function to convert Supabase data (with potential single object response) to an array
export function getArray<T>(data: T | T[] | null): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

// Extremely cautious string conversion
const ultraSafeString = (val: any, defaultString: string = '[Unconvertible Value]'): string => {
  try {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint' || typeof val === 'symbol') {
      return String(val);
    }
    if (typeof val === 'object') {
        try {
            const cache = new Set();
            return JSON.stringify(val, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (cache.has(value)) {
                        return '[Circular Reference]';
                    }
                    cache.add(value);
                }
                return value;
            }, 2); 
        } catch (jsonError) {
            return String(val); 
        }
    }
    return String(val);
  } catch (e) {
    return defaultString + ` (Conversion failed: ${ (e instanceof Error) ? e.message : 'unknown reason'})`;
  }
};


export function handleSupabaseError({ error: errorParam, customMessage }: { error: any, customMessage?: string }) {
  try {
    console.log('%cHANDLE_SUPABASE_ERROR_ENTRY: Received error parameter:', 'color: orange; font-weight: bold; background-color: black; padding: 2px;', errorParam);
    console.log(`%cHANDLE_SUPABASE_ERROR_ENTRY: typeof errorParam: ${typeof errorParam}, Boolean(errorParam): ${Boolean(errorParam)}`, 'color: orange; font-weight: bold; background-color: black; padding: 2px;');
  } catch (e) {
    console.error('CRITICAL FAILURE: Could not log entry details of handleSupabaseError.');
  }

  const operationDescription = typeof customMessage === 'string' && customMessage.trim() !== '' ? customMessage : 'Operação falhou';
  let errorDetails: string;
  let isNetworkError = false;
  let isRLSViolation = false;
  let rlsTableName: string | null = null;

  if (!errorParam) { 
    errorDetails = 'Nenhum objeto de erro foi fornecido ao manipulador.';
    try {
      console.warn(`HANDLER_LOGIC (FALSY_PATH): errorParam was falsy. Value:`, errorParam, `Type: ${typeof errorParam}. Operation description: "${operationDescription}"`);
    } catch(e) { /* Burying console errors */ }
  } else {
    try {
      if (typeof errorParam.message === 'string' && errorParam.message.trim() !== '') {
        errorDetails = errorParam.message;
      } else {
        errorDetails = ultraSafeString(errorParam, '[Erro não identificável]');
      }
      
      if (errorDetails.toLowerCase().includes("failed to fetch") || errorDetails.toLowerCase().includes("network error")) {
        isNetworkError = true;
      }

      // Enhanced RLS violation check
      const rlsMatch = errorDetails.match(/violates row-level security policy for table "([^"]+)"/i);
      if (rlsMatch && rlsMatch[1]) {
        isRLSViolation = true;
        rlsTableName = rlsMatch[1];
      } else if (errorDetails.toLowerCase().includes("row-level security policy")) { // Broader catch for RLS
        isRLSViolation = true;
        // Attempt to extract table name if possible, otherwise it will be null
        const genericTableMatch = errorDetails.match(/table "([^"]+)"/i);
        if (genericTableMatch && genericTableMatch[1]) {
            rlsTableName = genericTableMatch[1];
        }
      }

      console.log(`HANDLER_LOGIC (TRUTHY_PATH): Processing truthy errorParam. Determined error string: "${errorDetails}". Operation description: "${operationDescription}". Is network error: ${isNetworkError}. Is RLS violation: ${isRLSViolation}. RLS table: ${rlsTableName}`);
    } catch (e) {
      const exceptionString = ultraSafeString(e, '[Exceção não identificável durante o processamento do erro]');
      errorDetails = `[Exceção durante o processamento do erro: ${exceptionString}]`;
      try {
        console.error(`HANDLER_LOGIC (TRUTHY_PATH_EXCEPTION): Exception during truthy error processing. Error:`, e);
      } catch(e2) { /* Bury */ }
    }
  }
  
  let finalMessage: string;
  if (isRLSViolation) {
    const tableNameInfo = rlsTableName ? `na tabela "${rlsTableName}" ` : "";
    finalMessage = `${operationDescription}. VIOLAÇÃO DE RLS: A operação ${tableNameInfo}foi bloqueada pelas políticas de segurança a nível de linha (RLS) do Supabase. Verifique as permissões (INSERT, UPDATE, DELETE) para a role relevante (ex: 'authenticated', 'anon') no painel do Supabase. Detalhe: ${errorDetails}`;
  } else if (isNetworkError) {
    finalMessage = `${operationDescription}. Problema de conexão: Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente. Detalhe: ${errorDetails}`;
  } else {
    finalMessage = `${operationDescription}. Detalhe: ${errorDetails}`;
  }
  
  try {
    console.log(`%cHANDLER_THROWING: Final error message to be thrown: "${finalMessage}"`, 'color: magenta; font-weight: bold;');
  } catch (e) { /* Bury */ }

  throw new Error(finalMessage);
}
