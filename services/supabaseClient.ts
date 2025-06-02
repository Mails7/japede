
import { createClient, SupabaseClient } from '@supabase/supabase-js';

console.log('[SupabaseClient] Initializing Supabase client...');

// --- IMPORTANT FOR TYPESCRIPT ---
// If TypeScript shows errors like "Property 'env' does not exist on type 'ImportMeta'",
// it's because the TypeScript configuration is missing Vite's client types.
// The correct fix is to ensure your `tsconfig.json` includes "vite/client"
// in `compilerOptions.types`.
// For example:
// {
//   "compilerOptions": {
//     "types": ["vite/client", "node"] // Ensure "vite/client" is present
//   }
// }
// And ensure you have a `.env` file in your project root with:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
// --- IMPORTANT FOR TYPESCRIPT ---

const env = (import.meta as any).env; // Safely get the env object

let supabaseUrlInternal: string | undefined = env ? env.NEXT_PUBLIC_SUPABASE_URL : undefined;
let supabaseAnonKeyInternal: string | undefined = env ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

const urlMissing = !supabaseUrlInternal;
const keyMissing = !supabaseAnonKeyInternal;

console.log(`[SupabaseClient] NEXT_PUBLIC_SUPABASE_URL from import.meta.env: ${supabaseUrlInternal ? 'Loaded' : 'MISSING!'}`);
console.log(`[SupabaseClient] NEXT_PUBLIC_SUPABASE_ANON_KEY from import.meta.env: ${supabaseAnonKeyInternal ? 'Loaded' : 'MISSING!'}`);

if (urlMissing || keyMissing) {
  const missingVars = [];
  if (urlMissing) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (keyMissing) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  const warningMessage = `[SupabaseClient] AVISO: ${missingVars.join(' e/ou ')} não está(ão) definida(s) no seu arquivo .env. A aplicação pode não funcionar corretamente. Defina esta(s) variável(is) para conectar ao Supabase.`;
  console.warn(warningMessage);

  // Use placeholders to allow the app to load without crashing immediately.
  // Supabase client will be created but API calls will fail if these are used.
  if (urlMissing) {
    supabaseUrlInternal = 'http://missing-supabase-url.example.com'; // Placeholder URL
  }
  if (keyMissing) {
    // Placeholder key - a simple string is fine, createClient doesn't deeply validate key format at init.
    supabaseAnonKeyInternal = 'missing_supabase_anon_key_placeholder'; 
  }
  // The explicit throw new Error() is removed.
}

// createClient expects string, not undefined.
// The logic above ensures supabaseUrlInternal and supabaseAnonKeyInternal are strings by this point.
export const supabase: SupabaseClient = createClient(supabaseUrlInternal!, supabaseAnonKeyInternal!);
console.log('[SupabaseClient] Supabase client instance created (possibly with placeholder credentials).');


// Helper function to convert Supabase data (with potential single object response) to an array
export function getArray<T>(data: T | T[] | null): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

// Extremely cautious string conversion
const ultraSafeString = (val: any, defaultString: string = '[Valor Não Convertível]'): string => {
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
                        return '[Referência Circular]';
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
    return defaultString + ` (Conversão falhou: ${ (e instanceof Error) ? e.message : 'razão desconhecida'})`;
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

      // Check for placeholder credential usage indicative message
      if (errorDetails.includes("missing_supabase") || errorDetails.includes("placeholder_anon_key") || errorDetails.includes("placeholder.supabase.co")) {
        errorDetails = "As credenciais do Supabase parecem ser placeholders. Verifique seu arquivo .env.";
        isNetworkError = true; // Treat as effectively a setup/network issue for user feedback
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
    finalMessage = `${operationDescription}. Problema de conexão/configuração: Não foi possível conectar ao servidor ou as credenciais são inválidas/placeholders. Verifique sua conexão com a internet, o arquivo .env e as credenciais do Supabase. Detalhe: ${errorDetails}`;
  } else {
    finalMessage = `${operationDescription}. Detalhe: ${errorDetails}`;
  }
  
  try {
    console.log(`%cHANDLER_THROWING: Final error message to be thrown: "${finalMessage}"`, 'color: magenta; font-weight: bold;');
  } catch (e) { /* Bury */ }

  throw new Error(finalMessage);
}
