
export enum OrderStatus {
  PENDING = 'Pendente',
  PREPARING = 'Em Preparo',
  READY_FOR_PICKUP = 'Pronto para Retirada',
  OUT_FOR_DELIVERY = 'Saiu para Entrega',
  DELIVERED = 'Entregue',
  CANCELLED = 'Cancelado',
}

export enum OrderType {
  MESA = 'Mesa',
  DELIVERY = 'Delivery',
  BALCAO = 'Balcão',
}

export enum PaymentMethod {
  DINHEIRO = 'Dinheiro',
  CARTAO_DEBITO = 'Cartão de Débito',
  CARTAO_CREDITO = 'Cartão de Crédito',
  PIX = 'PIX',
  MULTIPLO = 'Múltiplo', // For split payments or future enhancements
}

export enum CashRegisterSessionStatus {
  OPEN = 'aberto',
  CLOSED = 'fechado',
}

export interface CashRegisterSession {
  id: string; // UUID from Supabase
  opened_at: string | Date;
  closed_at?: string | Date | null;
  opening_balance: number;
  calculated_sales?: number | null; 
  expected_in_cash?: number | null; 
  closing_balance_informed?: number | null; 
  difference?: number | null; 
  notes_opening?: string | null;
  notes_closing?: string | null;
  status: CashRegisterSessionStatus;
  created_at?: string;
}

export interface RawCashRegisterSession {
  id: string;
  opened_at: string;
  closed_at?: string | null;
  opening_balance: number;
  calculated_sales?: number | null;
  expected_in_cash?: number | null;
  closing_balance_informed?: number | null;
  difference?: number | null;
  notes_opening?: string | null;
  notes_closing?: string | null;
  status: CashRegisterSessionStatus;
  created_at: string;
}

export enum CashAdjustmentType {
  ADD = 'adicionar',
  REMOVE = 'remover',
}

export interface CashAdjustment {
  id: string;
  session_id: string;
  type: CashAdjustmentType;
  amount: number;
  reason: string;
  adjusted_at: string | Date;
  created_at?: string;
}

export interface RawCashAdjustment {
  id: string;
  session_id: string;
  type: CashAdjustmentType;
  amount: number;
  reason: string;
  adjusted_at: string;
  created_at: string;
}


export interface Category {
  id: string; 
  name: string;
  created_at?: string;
}

export interface PizzaCrust {
  id: string; 
  name: string;
  additionalPrice: number;
}

export interface PizzaSize {
  id: string; 
  name: string;
  price: number;
  crusts?: PizzaCrust[]; 
}

export interface MenuItem {
  id: string; 
  category_id: string; 
  name: string;
  description: string;
  price: number; 
  image_url?: string;
  available: boolean;
  item_type?: 'standard' | 'pizza';
  send_to_kitchen?: boolean; 

  sizes?: PizzaSize[]; 
  allow_half_and_half?: boolean;
  created_at?: string;
}

export interface OrderItemFlavorDetails {
  menuItemId: string;
  name: string;
  priceForSize: number;
  imageUrl?: string;
}

export interface OrderItem {
  id?: string; 
  order_id?: string; 
  menu_item_id: string; 
  quantity: number;
  name: string; 
  price: number; 

  selected_size_id?: string;
  selected_crust_id?: string; 
  is_half_and_half?: boolean;
  first_half_flavor?: OrderItemFlavorDetails; 
  second_half_flavor?: OrderItemFlavorDetails; 
  created_at?: string;
}


export interface Order {
  id: string; 
  customer_id?: string | null; 
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  items: OrderItem[]; 
  total_amount: number;
  status: OrderStatus;
  order_time: string | Date; 
  notes?: string;

  last_status_change_time: string | Date;
  next_auto_transition_time?: string | Date | null;
  auto_progress: boolean;
  current_progress_percent?: number;

  order_type?: OrderType;
  table_id?: string | null; 
  payment_method?: PaymentMethod | null; 
  amount_paid?: number | null;
  change_due?: number | null;
  cash_register_session_id?: string | null; 
  created_at?: string;
}

export interface AlertInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface CartItem {
  id: string; 
  menuItemId: string;
  name: string;
  price: number; 
  quantity: number;
  imageUrl?: string;

  itemType?: 'standard' | 'pizza';
  selectedSize?: PizzaSize; 
  selectedCrust?: PizzaCrust; 
  isHalfAndHalf?: boolean;
  firstHalfFlavor?: OrderItemFlavorDetails;
  secondHalfFlavor?: OrderItemFlavorDetails;
}


export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  addressReference?: string; 
  notes?: string;
}

export interface ManualOrderItem extends CartItem {}

export interface ManualOrderData {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  addressReference?: string;
  notes?: string;
  items: ManualOrderItem[];
  
  orderType: OrderType;
  tableId?: string;
  paymentMethod?: PaymentMethod; 
  amountPaid?: number;
}

export enum TableStatus {
  AVAILABLE = 'Disponível',
  OCCUPIED = 'Ocupada',
  RESERVED = 'Reservada',
  NEEDS_CLEANING = 'Limpeza Pendente',
}

export interface ReservationDetails { 
  customerName?: string;
  time?: string; 
  guestCount?: number;
  notes?: string;
}

export interface Table {
  id: string; 
  name: string;
  capacity: number;
  status: TableStatus;
  current_order_id?: string | null; 
  reservation_details?: ReservationDetails | null; 
  created_at?: string;
}


export interface RawMenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  available: boolean;
  item_type: 'standard' | 'pizza';
  send_to_kitchen?: boolean | null; 
  sizes: PizzaSize[] | null; 
  allow_half_and_half: boolean | null;
  created_at: string;
}

export interface RawOrder {
  id: string; 
  customer_id?: string | null; 
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount: number;
  status: OrderStatus;
  order_time: string; 
  notes?: string;
  last_status_change_time: string;
  next_auto_transition_time?: string | null;
  auto_progress: boolean;
  current_progress_percent?: number;
  order_type?: OrderType;
  table_id?: string | null; 
  payment_method?: PaymentMethod | null; 
  amount_paid?: number | null;
  change_due?: number | null;
  cash_register_session_id?: string | null; 
  created_at: string;
}

export interface RawOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  name: string;
  price: number;
  selected_size_id?: string;
  selected_crust_id?: string;
  is_half_and_half?: boolean;
  first_half_flavor?: OrderItemFlavorDetails | null; 
  second_half_flavor?: OrderItemFlavorDetails | null;
  created_at: string;
}

export interface RawCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface RawTable {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  current_order_id?: string | null;
  reservation_details?: ReservationDetails | null;
  created_at: string;
}

export interface PaymentDetails {
    paymentMethod: PaymentMethod;
    amountPaid?: number; 
}

export interface ActiveTableOrderData {
    orderId: string;
    itemsToAdd: CartItem[];
    paymentDetails?: PaymentDetails; 
    notes?: string; 
}

// Re-added placeholder/basic Profile type
export interface Profile {
  id: string;
  user_id?: string; // Link to Supabase Auth user
  full_name?: string | null;
  phone?: string | null;
  email?: string | null; // Denormalized from auth.users for easier access
  default_address?: string | null;
  default_address_reference?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  // For CustomerManagementPage view model (these might not be directly from DB)
  lastOrderDate?: string | Date | null;
  totalOrders?: number;
  totalSpent?: number;
}

// Re-added placeholder/basic CustomerFormValues type
export interface CustomerFormValues {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  addressReference?: string;
  notes?: string;
}

// Re-added placeholder/basic SupabaseUser type (mimicking a simplified version)
export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  app_metadata?: {
      provider?: string;
      [key: string]: any;
  };
  user_metadata?: {
      [key: string]: any;
      full_name?: string; // Common user_metadata field
  };
  aud?: string;
  created_at?: string;
}

// Re-added placeholder/basic SupabaseSession type (mimicking a simplified version)
export interface SupabaseSession {
  access_token: string;
  token_type: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  user: SupabaseUser;
}


// --- Application Settings ---
export interface OpeningHoursEntry {
  open: string; // HH:MM format
  close: string; // HH:MM format
  enabled: boolean;
}

export interface OpeningHours {
  monday: OpeningHoursEntry;
  tuesday: OpeningHoursEntry;
  wednesday: OpeningHoursEntry;
  thursday: OpeningHoursEntry;
  friday: OpeningHoursEntry;
  saturday: OpeningHoursEntry;
  sunday: OpeningHoursEntry;
}

export type DeliveryFeeType = 'fixed' | 'per_km' | 'free' | 'free_above_value';

export interface DeliveryFeeSettings {
  type: DeliveryFeeType;
  fixed_amount?: number;
  amount_per_km?: number;
  min_order_for_free_delivery?: number;
}

export interface StoreSettings {
  store_name: string;
  logo_url?: string | null; 
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_city: string;
  address_postal_code: string;
  address_complement?: string;
  phone_number: string; // Main store contact phone
  opening_hours: OpeningHours;
  delivery_fee: DeliveryFeeSettings;
  min_order_value_delivery?: number; // Minimum order value to qualify for delivery at all
  store_timezone?: string; // e.g., 'America/Sao_Paulo'
}

export interface PaymentSettings {
  accept_cash: boolean;
  accept_debit_card: boolean;
  accept_credit_card: boolean;
  accept_pix: boolean;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pix_key?: string;
}

export interface WhatsAppSettings {
    api_token?: string; 
    phone_number_id?: string; 
    phone_display_number?: string; 
    notify_order_confirmation: boolean;
    template_order_confirmation?: string; 
    notify_order_ready: boolean;
    template_order_ready?: string;
    notify_order_out_for_delivery: boolean;
    template_order_out_for_delivery?: string;
}

export interface PredefinedSound {
  key: string;
  label: string;
  url: string;
}

export interface NotificationSettings {
    sound_alert_new_order_admin: boolean; 
    email_admin_new_order?: string; 
    predefined_sound_key?: string; // Key for selected predefined sound or 'custom'
    sound_new_order_url?: string | null; // URL for the sound to play
}

// --- Order Flow Settings ---
export type OrderFlowDurations = {
  [key in OrderStatus]?: number; // Duration in milliseconds
};

export type OrderFlowSettings = {
  [key in OrderType]: OrderFlowDurations;
};

// For easier use after parsing
export interface ParsedOpeningHoursEntry {
  openMinutes: number; // Minutes from midnight
  closeMinutes: number; // Minutes from midnight
  enabled: boolean;
}
export type ParsedOpeningHours = Record<keyof OpeningHours, ParsedOpeningHoursEntry>;


export interface AppSettings {
  id?: string; 
  store: StoreSettings;
  payments: PaymentSettings;
  whatsapp: WhatsAppSettings;
  notifications: NotificationSettings;
  order_flow: OrderFlowSettings; 
  n8n_api_key?: string | null; 
  updated_at?: string;
  // Non-persistent, calculated field for easier use
  parsedOpeningHours?: ParsedOpeningHours; 
}

// --- Default Values for Settings ---
export const defaultOpeningHoursEntry: OpeningHoursEntry = { open: '09:00', close: '22:00', enabled: true };
export const defaultOrderFlowDurations: OrderFlowDurations = {
  [OrderStatus.PENDING]: 30 * 1000,        // 30 segundos
  [OrderStatus.PREPARING]: 3 * 60 * 1000,   // 3 minutos
  [OrderStatus.READY_FOR_PICKUP]: 2 * 60 * 1000, // 2 minutos
  [OrderStatus.OUT_FOR_DELIVERY]: 30 * 60 * 1000, // 30 minutos (exemplo)
  [OrderStatus.DELIVERED]: 0,
  [OrderStatus.CANCELLED]: 0,
};

export const defaultOrderFlowSettings: OrderFlowSettings = {
  [OrderType.MESA]: {
    ...defaultOrderFlowDurations,
    [OrderStatus.OUT_FOR_DELIVERY]: 0, // Não aplicável para mesas
  },
  [OrderType.DELIVERY]: {
    ...defaultOrderFlowDurations,
  },
  [OrderType.BALCAO]: {
    ...defaultOrderFlowDurations,
    [OrderStatus.OUT_FOR_DELIVERY]: 0, // Não aplicável para balcão
  },
};


export const defaultStoreSettings: StoreSettings = {
  store_name: 'Nome da Sua Loja Aqui',
  logo_url: null, 
  address_street: '', address_number: '', address_neighborhood: '', address_city: '', address_postal_code: '',
  phone_number: '',
  opening_hours: {
    monday: { ...defaultOpeningHoursEntry }, tuesday: { ...defaultOpeningHoursEntry }, wednesday: { ...defaultOpeningHoursEntry },
    thursday: { ...defaultOpeningHoursEntry }, friday: { ...defaultOpeningHoursEntry, close: '23:00' },
    saturday: { ...defaultOpeningHoursEntry, open: '10:00', close: '23:00' }, sunday: { ...defaultOpeningHoursEntry, open: '10:00', close: '18:00', enabled: false },
  },
  delivery_fee: { type: 'fixed' as DeliveryFeeType, fixed_amount: 5.00 },
  min_order_value_delivery: 20.00,
  store_timezone: 'America/Sao_Paulo', // Fuso horário padrão
};

export const defaultPaymentSettings: PaymentSettings = {
  accept_cash: true, accept_debit_card: true, accept_credit_card: true, accept_pix: true,
  pix_key_type: 'random', pix_key: '',
};
export const defaultWhatsAppSettings: WhatsAppSettings = {
  notify_order_confirmation: false, notify_order_ready: false, notify_order_out_for_delivery: false,
};

const DEFAULT_NEW_ORDER_SOUND_URL = 'https://mdn.github.io/voice-change-o-matic/audio/sine.mp3'; 

export const defaultNotificationSettings: NotificationSettings = {
  sound_alert_new_order_admin: true,
  email_admin_new_order: '',
  predefined_sound_key: 'default_ifood_like', 
  sound_new_order_url: DEFAULT_NEW_ORDER_SOUND_URL, 
};

export const defaultAppSettings: AppSettings = {
  id: 'default_settings',
  store: defaultStoreSettings,
  payments: defaultPaymentSettings,
  whatsapp: defaultWhatsAppSettings,
  notifications: defaultNotificationSettings,
  order_flow: defaultOrderFlowSettings, 
  n8n_api_key: null,
  updated_at: undefined,
};

// --- AppState and Actions ---
export interface AppState {
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  tables: Table[];
  profiles: Profile[]; // Uncommented
  cart: CartItem[];
  customerDetails: CustomerDetails | null;
  alert: AlertInfo | null;
  isLoading: boolean;
  isLoadingProfiles: boolean; // Uncommented
  authLoading: boolean; // Uncommented
  activeCashSession: CashRegisterSession | null;
  cashSessions: CashRegisterSession[];
  cashAdjustments: CashAdjustment[];
  currentUser: SupabaseUser | null; // Uncommented
  currentProfile: Profile | null; // Uncommented
  cashAdjustmentsTableMissing: boolean;
  settings: AppSettings | null;
  isLoadingSettings: boolean;
  settingsTableMissing: boolean;
  settingsError: string | null;
  prefilledCustomerForOrder: Profile | null; // Uncommented
  shouldOpenManualOrderModal: boolean;
  isStoreOpenNow: boolean;
  directOrderProfile: Profile | null; // Uncommented
  passwordRecoverySession: SupabaseSession | null; // Uncommented
  isDeveloperAdmin: boolean; // Uncommented
}

export type Action =
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY_SUCCESS'; payload: Category }
  | { type: 'UPDATE_CATEGORY_SUCCESS'; payload: Category }
  | { type: 'DELETE_CATEGORY_SUCCESS'; payload: string }
  | { type: 'SET_MENU_ITEMS'; payload: MenuItem[] }
  | { type: 'ADD_MENU_ITEM_SUCCESS'; payload: MenuItem }
  | { type: 'UPDATE_MENU_ITEM_SUCCESS'; payload: MenuItem }
  | { type: 'DELETE_MENU_ITEM_SUCCESS'; payload: string }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER_SUCCESS'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS_SUCCESS'; payload: Order }
  | { type: 'REALTIME_ORDER_UPDATE'; payload: { eventType: string, new?: any, old?: any, [key: string]: any } }
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'ADD_TABLE_SUCCESS'; payload: Table }
  | { type: 'UPDATE_TABLE_SUCCESS'; payload: Table }
  | { type: 'DELETE_TABLE_SUCCESS'; payload: string }
  | { type: 'SET_PROFILES'; payload: Profile[] } // Uncommented
  | { type: 'ADD_PROFILE_SUCCESS'; payload: Profile } // Uncommented
  | { type: 'UPDATE_PROFILE_SUCCESS'; payload: Profile } // Uncommented
  | { type: 'DELETE_PROFILE_SUCCESS'; payload: string } // Uncommented
  | { type: 'SET_LOADING_PROFILES'; payload: boolean } // Uncommented
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'ADD_RAW_CART_ITEM_SUCCESS'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { cartItemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CUSTOMER_DETAILS'; payload: CustomerDetails | null }
  | { type: 'SET_ALERT'; payload: AlertInfo | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH_LOADING'; payload: boolean } // Uncommented
  | { type: 'SET_ACTIVE_CASH_SESSION'; payload: CashRegisterSession | null }
  | { type: 'SET_CASH_SESSIONS'; payload: CashRegisterSession[] }
  | { type: 'ADD_CASH_SESSION_SUCCESS'; payload: CashRegisterSession }
  | { type: 'UPDATE_CASH_SESSION_SUCCESS'; payload: CashRegisterSession }
  | { type: 'SET_CASH_ADJUSTMENTS'; payload: CashAdjustment[] }
  | { type: 'ADD_CASH_ADJUSTMENT_SUCCESS'; payload: CashAdjustment }
  | { type: 'SET_CURRENT_USER'; payload: SupabaseUser | null } // Uncommented
  | { type: 'SET_CURRENT_PROFILE'; payload: Profile | null } // Uncommented
  | { type: 'SET_CASH_ADJUSTMENTS_TABLE_MISSING'; payload: boolean }
  | { type: 'FETCH_SETTINGS_START' }
  | { type: 'FETCH_SETTINGS_SUCCESS'; payload: AppSettings }
  | { type: 'FETCH_SETTINGS_FAILURE'; payload: string }
  | { type: 'UPDATE_SETTINGS_START' }
  | { type: 'UPDATE_SETTINGS_SUCCESS'; payload: AppSettings }
  | { type: 'UPDATE_SETTINGS_FAILURE'; payload: string }
  | { type: 'SET_SETTINGS_TABLE_MISSING'; payload: boolean }
  | { type: 'SET_PREFILLED_CUSTOMER_FOR_ORDER'; payload: Profile | null } // Uncommented
  | { type: 'SET_SHOULD_OPEN_MANUAL_ORDER_MODAL'; payload: boolean }
  | { type: 'SET_IS_STORE_OPEN_NOW'; payload: boolean }
  | { type: 'SET_DIRECT_ORDER_PROFILE'; payload: Profile | null } // Uncommented
  | { type: 'SET_PASSWORD_RECOVERY_SESSION'; payload: SupabaseSession | null } // Uncommented
  | { type: 'CLEAR_PASSWORD_RECOVERY_SESSION' } // Uncommented
  | { type: 'SET_IS_DEVELOPER_ADMIN'; payload: boolean }; // Uncommented

export type AdminPanelView = 
  | 'dashboard' 
  | 'menu' 
  | 'orders' 
  | 'kitchen' 
  | 'tables' 
  // | 'customers' // This was commented out in original user files, keeping it so
  | 'financials' 
  | 'settings';