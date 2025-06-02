import { supabase } from './supabaseClient';
import { SUPABASE_EDGE_FUNCTION_GEMINI } from '../constants';

export const generateDescription = async (itemName: string): Promise<string> => {
  if (!itemName || itemName.trim() === "") {
    return "Nome do item não fornecido.";
  }

  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(SUPABASE_EDGE_FUNCTION_GEMINI, {
      body: { itemName }, // Pass itemName in the request body
    });

    if (error) {
      console.error('Supabase Edge Function error:', error);
      // Try to provide a more user-friendly error based on common issues
      if (error.message.includes("Function not found")) {
        throw new Error(`Falha ao chamar a IA: Função '${SUPABASE_EDGE_FUNCTION_GEMINI}' não encontrada no Supabase. Verifique se ela foi implantada.`);
      }
      if (error.message.toLowerCase().includes("failed to fetch") || error.message.toLowerCase().includes("network error")) {
        throw new Error("Falha de rede ao tentar se comunicar com o serviço de IA. Verifique sua conexão.");
      }
      throw new Error(`Erro ao invocar a função da IA: ${error.message}`);
    }

    if (!data || !data.description) {
      // This case might occur if the function runs but doesn't return the expected structure
      console.warn('Supabase Edge Function response missing description:', data);
      throw new Error("A IA não retornou uma descrição válida. A resposta da função pode estar malformada.");
    }
    
    return data.description.trim();

  } catch (error) {
    console.error("Error calling Supabase Edge Function for Gemini:", error);
    if (error instanceof Error) {
        // Preserve specific error messages if they are already user-friendly
        if (error.message.startsWith("Falha ao chamar a IA:") || error.message.startsWith("Falha de rede") || error.message.startsWith("A IA não retornou")) {
            throw error;
        }
        throw new Error(`Erro ao gerar descrição com IA: ${error.message}`);
    }
    throw new Error("Erro desconhecido ao se comunicar com o serviço de IA.");
  }
};