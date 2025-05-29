
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { supabase, getArray, handleSupabaseError } from '../services/supabaseClient';
import { AppSettings, StoreSettings, PaymentSettings, WhatsAppSettings, NotificationSettings, OpeningHoursEntry, DeliveryFeeType } from '../types';
import { useAppContext } from './AppContext'; // To use setAlert

// --- Default Values for Settings ---
export const defaultOpeningHoursEntry: OpeningHoursEntry = { open: '09:00', close: '22:00', enabled: true };
export const defaultStoreSettings: StoreSettings = {
  store_name: 'Nome da Loja',
  address_street: '',
  address_number: '',
  address_neighborhood: '',
  address_city: '',
  address_postal_code: '',
  address_complement: '',
  phone_number: '',
  opening_hours: {
    monday: { ...defaultOpeningHoursEntry },
    tuesday: { ...defaultOpeningHoursEntry },
    wednesday: { ...defaultOpeningHoursEntry },
    thursday: { ...defaultOpeningHoursEntry },
    friday: { ...defaultOpeningHoursEntry, close: '23:00' },
    saturday: { ...defaultOpeningHoursEntry, open: '10:00', close: '23:00' },
    sunday: { ...defaultOpeningHoursEntry, open: '10:00', close: '18:00', enabled: false },
  },
  delivery_fee: {
    type: 'fixed' as DeliveryFeeType,
    fixed_amount: 5.00,
  },
  min_order_value_delivery: 20.00,
};

export const defaultPaymentSettings: PaymentSettings = {
  accept_cash: true,
  accept_debit_card: true,
  accept_credit_card: true,
  accept_pix: true,
  pix_key_type: 'random',
  pix_key: '',
};

export const defaultWhatsAppSettings: WhatsAppSettings = {
  notify_order_confirmation: false,
  notify_order_ready: false,
  notify_order_out_for_delivery: false,
};

export const defaultNotificationSettings: NotificationSettings = {
  sound_alert_new_order_admin: true,
  email_admin_new_order: '',
};

export const defaultAppSettings: AppSettings = {
  id: 'default_settings', // Fixed ID for single-row settings
  store: defaultStoreSettings,
  payments: defaultPaymentSettings,
  whatsapp: defaultWhatsAppSettings,
  notifications: defaultNotificationSettings,
  n8n_api_key: null, // Initialize n8n_api_key
  updated_at: undefined,
};


// --- State ---
interface SettingsState {
  settings: AppSettings | null;
  isLoadingSettings: boolean;
  error: string | null;
  settingsTableMissing: boolean; // New flag
}

const initialState: SettingsState = {
  settings: null,
  isLoadingSettings: true,
  error: null,
  settingsTableMissing: false, // Initialize flag
};

// --- Actions ---
type SettingsAction =
  | { type: 'FETCH_SETTINGS_START' }
  | { type: 'FETCH_SETTINGS_SUCCESS'; payload: AppSettings }
  | { type: 'FETCH_SETTINGS_FAILURE'; payload: string }
  | { type: 'UPDATE_SETTINGS_START' }
  | { type: 'UPDATE_SETTINGS_SUCCESS'; payload: AppSettings }
  | { type: 'UPDATE_SETTINGS_FAILURE'; payload: string }
  | { type: 'SET_SETTINGS_LOCALLY'; payload: AppSettings }
  | { type: 'SET_SETTINGS_TABLE_MISSING'; payload: boolean }; // New action


// --- Reducer ---
const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
  switch (action.type) {
    case 'FETCH_SETTINGS_START':
    case 'UPDATE_SETTINGS_START':
      return { ...state, isLoadingSettings: true, error: null };
    case 'FETCH_SETTINGS_SUCCESS':
    case 'UPDATE_SETTINGS_SUCCESS':
      return { ...state, settings: action.payload, isLoadingSettings: false, error: null };
    case 'FETCH_SETTINGS_FAILURE':
    case 'UPDATE_SETTINGS_FAILURE':
      return { ...state, isLoadingSettings: false, error: action.payload };
    case 'SET_SETTINGS_LOCALLY':
        return { ...state, settings: action.payload, isLoadingSettings: false };
    case 'SET_SETTINGS_TABLE_MISSING':
        return { ...state, settingsTableMissing: action.payload };
    default:
      return state;
  }
};

// --- Context Props Interface ---
interface SettingsContextProps extends SettingsState {
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: AppSettings) => Promise<boolean>;
  setSettingsLocally: (newSettings: AppSettings) => void;
}

// --- Context Creation ---
const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

// --- Provider Component ---
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { setAlert } = useAppContext(); // Use global alert for notifications

  const fetchSettings = useCallback(async () => {
    dispatch({ type: 'FETCH_SETTINGS_START' });
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('settings_data') // Select the JSONB column
        .eq('id', 'default_settings')
        .single();

      if (error) {
        if (error.message.includes('relation "public.app_settings" does not exist')) {
            console.warn("[SettingsContext] CRITICAL: Tabela 'app_settings' não encontrada no banco de dados.");
            setAlert({ 
                message: "Atenção: A tabela de configurações ('app_settings') não foi encontrada. Usando configurações padrão. Crie a tabela no Supabase para salvar as configurações.", 
                type: 'error',
            });
            dispatch({ type: 'FETCH_SETTINGS_SUCCESS', payload: defaultAppSettings }); // Use defaults
            dispatch({ type: 'SET_SETTINGS_TABLE_MISSING', payload: true });
            return;
        } else if (error.code !== 'PGRST116') { // PGRST116: "Searched for a single row, but found 0 rows" - this is NOT an error for us here
            console.error("[SettingsContext] Falha ao buscar configurações.:", error.message);
            dispatch({ type: 'FETCH_SETTINGS_FAILURE', payload: error.message });
            setAlert({ message: `Falha ao buscar configurações: ${error.message}`, type: 'error'});
            return;
        }
      }
      
      dispatch({ type: 'SET_SETTINGS_TABLE_MISSING', payload: false }); 

      if (data && data.settings_data) {
        const fetched = data.settings_data as Partial<AppSettings>;
        const safeFetchedStore = (typeof fetched.store === 'object' && fetched.store !== null) ? fetched.store : {};
        const safeFetchedPayments = (typeof fetched.payments === 'object' && fetched.payments !== null) ? fetched.payments : {};
        const safeFetchedWhatsApp = (typeof fetched.whatsapp === 'object' && fetched.whatsapp !== null) ? fetched.whatsapp : {};
        const safeFetchedNotifications = (typeof fetched.notifications === 'object' && fetched.notifications !== null) ? fetched.notifications : {};
        
        const mergedSettings: AppSettings = {
            ...defaultAppSettings, 
            ...fetched, // Spread fetched data which might include n8n_api_key
            store: { ...defaultAppSettings.store, ...safeFetchedStore },
            payments: { ...defaultAppSettings.payments, ...safeFetchedPayments },
            whatsapp: { ...defaultAppSettings.whatsapp, ...safeFetchedWhatsApp },
            notifications: { ...defaultAppSettings.notifications, ...safeFetchedNotifications },
            id: 'default_settings', // Ensure ID is always default_settings
            n8n_api_key: fetched.n8n_api_key !== undefined ? fetched.n8n_api_key : defaultAppSettings.n8n_api_key, // Explicitly handle n8n_api_key
        };
        dispatch({ type: 'FETCH_SETTINGS_SUCCESS', payload: mergedSettings });
      } else {
        console.log("[SettingsContext] Nenhuma configuração encontrada para 'default_settings', usando e tentando salvar padrões.");
        dispatch({ type: 'FETCH_SETTINGS_SUCCESS', payload: defaultAppSettings });
        
        if (!state.settingsTableMissing) { 
            console.log("[SettingsContext] Tabela 'app_settings' existe, tentando salvar configurações padrão (ID: default_settings).");
            // The `settings_data` column should store the entire AppSettings object.
            const { error: upsertError } = await supabase.from('app_settings').upsert({ id: 'default_settings', settings_data: defaultAppSettings });
            if (upsertError) {
                 // Log em inglês para o console do desenvolvedor
                 console.error(`[SettingsContext] RLS VIOLATION - Default Settings Save Failed: Unable to save default settings (ID: 'default_settings') to the 'app_settings' table. Supabase RLS policies prevented the write operation. Error: "${upsertError.message}". The application will proceed using internal default settings. ACTION REQUIRED: To persist settings, modify the RLS policies on the 'app_settings' table in your Supabase dashboard to allow INSERT/UPDATE for the 'default_settings' row by the relevant role (e.g., 'anon', 'authenticated').`);
                 if (upsertError.message.toLowerCase().includes("violates row-level security policy")) {
                    // Alerta da UI em português
                    setAlert({ 
                        message: `VIOLAÇÃO DE RLS - Falha ao Salvar Configurações Padrão: Não foi possível salvar as configurações padrão (ID: 'default_settings') na tabela 'app_settings'. As políticas de RLS do Supabase impediram a operação de escrita. Erro: "${upsertError.message}". A aplicação continuará usando as configurações padrão internas. AÇÃO NECESSÁRIA: Para persistir as configurações, modifique as políticas RLS da tabela 'app_settings' no seu painel Supabase para permitir operações de INSERT/UPDATE para a linha 'default_settings' pela role relevante (ex: 'anon', 'authenticated').`,
                        type: 'error' 
                    });
                 } else {
                    setAlert({ message: `Falha ao inicializar configurações no banco: ${upsertError.message}`, type: 'error' });
                 }
            }
        }
      }
    } catch (e) {
      const errorMsg = (e as Error).message;
      dispatch({ type: 'FETCH_SETTINGS_FAILURE', payload: errorMsg });
      setAlert({ message: `Erro ao buscar configurações: ${errorMsg}`, type: 'error' });
    }
  }, [setAlert, state.settingsTableMissing]);

  const updateSettings = useCallback(async (newSettings: AppSettings): Promise<boolean> => {
    if (state.settingsTableMissing) {
        setAlert({ message: "Não é possível salvar. A tabela de configurações ('app_settings') não existe no banco. Por favor, crie a tabela primeiro.", type: 'error' });
        return false;
    }
    dispatch({ type: 'UPDATE_SETTINGS_START' });
    try {
      // Ensure the payload for upsert contains the entire settings object within 'settings_data'
      const payloadToSave = {
        id: 'default_settings', 
        settings_data: newSettings, // The entire AppSettings object goes into the JSONB column
        updated_at: new Date().toISOString(),
      };
      // It seems the table `app_settings` might have `id`, `settings_data`, `updated_at`
      // If `updated_at` is not a column on `app_settings` table, it should be removed from `payloadToSave`
      // For now, assuming it exists.
      
      const { error } = await supabase.from('app_settings').upsert(payloadToSave).eq('id', 'default_settings');

      if (error) {
        console.error("[SettingsContext] Falha ao atualizar configurações.:", error.message);
        dispatch({ type: 'UPDATE_SETTINGS_FAILURE', payload: error.message });
        if (error.message.toLowerCase().includes("violates row-level security policy")) {
            setAlert({ 
                message: `Falha ao salvar configurações: As permissões RLS da tabela 'app_settings' no Supabase impedem a escrita. Erro Supabase: "${error.message}". Verifique as políticas de INSERT/UPDATE (ID 'default_settings', roles 'anon'/'authenticated').`, 
                type: 'error' 
            });
        } else {
            setAlert({ message: `Erro ao salvar configurações: ${error.message}`, type: 'error' });
        }
        return false;
      }
      dispatch({ type: 'UPDATE_SETTINGS_SUCCESS', payload: newSettings });
      setAlert({ message: 'Configurações salvas com sucesso!', type: 'success' });
      return true;
    } catch (e) {
      const errorMsg = (e as Error).message;
      dispatch({ type: 'UPDATE_SETTINGS_FAILURE', payload: errorMsg });
      setAlert({ message: `Erro ao salvar configurações: ${errorMsg}`, type: 'error' });
      return false;
    }
  }, [setAlert, state.settingsTableMissing]);

  const setSettingsLocally = useCallback((newSettings: AppSettings) => {
    dispatch({ type: 'SET_SETTINGS_LOCALLY', payload: newSettings });
  }, []);


  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const contextValue: SettingsContextProps = {
    ...state,
    fetchSettings,
    updateSettings,
    setSettingsLocally,
  };

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
};

// --- Custom Hook ---
export const useSettingsContext = (): SettingsContextProps => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
