
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
  OPEN = 'open',
  CLOSED = 'closed',
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
  ADD = 'add',
  REMOVE = 'remove',
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
  customer_id?: string | null; // Link to auth.users ID (via profiles table)
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
  customer_id?: string | null; // Link to auth.users ID (via profiles table)
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

// --- Customer Auth & Profile ---
import { User as SupabaseAuthUser } from '@supabase/supabase-js';

export type SupabaseUser = SupabaseAuthUser;

export interface Profile {
  id: string; // Must match auth.users.id
  full_name?: string | null;
  phone?: string | null;
  default_address?: string | null;
  default_address_reference?: string | null;
  created_at?: string;
  updated_at?: string;
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
}

export interface PaymentSettings {
  accept_cash: boolean;
  accept_debit_card: boolean;
  accept_credit_card: boolean;
  accept_pix: boolean;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pix_key?: string;
  // gateway_stripe_enabled: boolean;
  // gateway_mercado_pago_enabled: boolean;
}

export interface WhatsAppSettings {
    api_token?: string; // For WhatsApp Business API
    phone_number_id?: string; // From WhatsApp Business API
    phone_display_number?: string; // The number customers see
    notify_order_confirmation: boolean;
    template_order_confirmation?: string; // Name/ID of the template
    notify_order_ready: boolean;
    template_order_ready?: string;
    notify_order_out_for_delivery: boolean;
    template_order_out_for_delivery?: string;
}

export interface NotificationSettings {
    sound_alert_new_order_admin: boolean; // For the admin panel
    email_admin_new_order?: string; // Email to send admin notifications
}

export interface AppSettings {
  id?: string; // Assuming a single row in DB, might be 'default' or establishment ID
  store: StoreSettings;
  payments: PaymentSettings;
  whatsapp: WhatsAppSettings;
  notifications: NotificationSettings;
  n8n_api_key?: string | null; // Added for n8n integration API key
  updated_at?: string;
}
