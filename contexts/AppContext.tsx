
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useState, useRef } from 'react';
import { supabase, getArray, handleSupabaseError } from '../services/supabaseClient';
import { 
    Category, MenuItem, Order, OrderStatus, AlertInfo, CartItem, CustomerDetails, 
    OrderItem, ManualOrderData, OrderType, PaymentMethod, Table, TableStatus, ReservationDetails,
    RawCategory, RawMenuItem, RawTable, RawOrder, RawOrderItem, OrderItemFlavorDetails, PizzaSize, PizzaCrust,
    CashRegisterSession, RawCashRegisterSession, CashRegisterSessionStatus, PaymentDetails,
    CashAdjustment, RawCashAdjustment, CashAdjustmentType, 
    AppSettings, defaultAppSettings, 
    OpeningHours, ParsedOpeningHours, 
    NotificationSettings, 
    AppState, Action,
    Profile, CustomerFormValues, SupabaseUser, SupabaseSession // Added missing types
} from '../types';
import { 
    generateId, 
    ORDER_PROGRESSION_SEQUENCE, 
    AUTO_PROGRESS_INTERVAL
} from '../constants';
import { parseOpeningHours, isStoreOpen } from '../utils/timeUtils'; 


// --- Initial State ---
const initialState: AppState = {
  categories: [],
  menuItems: [],
  orders: [],
  tables: [],
  profiles: [], // Added
  cart: [],
  customerDetails: null,
  alert: null,
  isLoading: true,
  isLoadingProfiles: true, // Added
  authLoading: false, // Added 
  activeCashSession: null,
  cashSessions: [],
  cashAdjustments: [],
  currentUser: null, // Added
  currentProfile: null, // Added
  cashAdjustmentsTableMissing: false,
  settings: null, 
  isLoadingSettings: true, 
  settingsTableMissing: false, 
  settingsError: null, 
  prefilledCustomerForOrder: null, // Added
  shouldOpenManualOrderModal: false,
  isStoreOpenNow: false, 
  directOrderProfile: null, // Added
  passwordRecoverySession: null, // Added
  isDeveloperAdmin: false, // Added
};


// --- Reducer ---
const appReducer = (state: AppState, action: Action): AppState => {
  console.log(`[AppContextReducer] Action: ${action.type}`, 'payload' in action ? `Payload: ${JSON.stringify((action as any).payload)}` : '(No payload)');
  switch (action.type) {
    case 'SET_CATEGORIES': return { ...state, categories: action.payload };
    case 'ADD_CATEGORY_SUCCESS': return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY_SUCCESS': return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY_SUCCESS': return { ...state, categories: state.categories.filter(c => c.id !== action.payload), menuItems: state.menuItems.filter(mi => mi.category_id !== action.payload) };
    case 'SET_MENU_ITEMS': return { ...state, menuItems: action.payload };
    case 'ADD_MENU_ITEM_SUCCESS': return { ...state, menuItems: [...state.menuItems, action.payload] };
    case 'UPDATE_MENU_ITEM_SUCCESS': return { ...state, menuItems: state.menuItems.map(item => item.id === action.payload.id ? action.payload : item) };
    case 'DELETE_MENU_ITEM_SUCCESS': return { ...state, menuItems: state.menuItems.filter(item => item.id !== action.payload) };
    case 'SET_ORDERS': return { ...state, orders: action.payload.sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
    case 'ADD_ORDER_SUCCESS':
      const filteredOrders = state.orders.filter(o => o.id !== action.payload.id);
      return { ...state, orders: [action.payload, ...filteredOrders].sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
    case 'UPDATE_ORDER_STATUS_SUCCESS':
        const updatedOrderSuccess = action.payload;
        const existingOrderSuccessIndex = state.orders.findIndex(o => o.id === updatedOrderSuccess.id);
        if (existingOrderSuccessIndex > -1) {
            const newOrders = [...state.orders];
            newOrders[existingOrderSuccessIndex] = updatedOrderSuccess;
            return { ...state, orders: newOrders.sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
        }
        return { ...state, orders: [updatedOrderSuccess, ...state.orders].sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
    case 'REALTIME_ORDER_UPDATE':
        const updatedOrder = action.payload.new as Order; 
        if (updatedOrder) {
             const existingOrderIndex = state.orders.findIndex(o => o.id === updatedOrder.id);
            if (existingOrderIndex > -1) {
                const newOrders = [...state.orders];
                newOrders[existingOrderIndex] = updatedOrder;
                return { ...state, orders: newOrders.sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
            }
            return { ...state, orders: [updatedOrder, ...state.orders].sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
        }
        return state; 
    case 'SET_TABLES': return { ...state, tables: action.payload.sort((a,b)=> a.name.localeCompare(b.name)) };
    case 'ADD_TABLE_SUCCESS': return { ...state, tables: [...state.tables, action.payload].sort((a,b)=> a.name.localeCompare(b.name)) };
    case 'UPDATE_TABLE_SUCCESS': return { ...state, tables: state.tables.map(t => t.id === action.payload.id ? action.payload : t).sort((a,b)=> a.name.localeCompare(b.name)) };
    case 'DELETE_TABLE_SUCCESS': return { ...state, tables: state.tables.filter(t => t.id !== action.payload).sort((a,b)=> a.name.localeCompare(b.name)) };
    
    case 'SET_PROFILES': return { ...state, profiles: action.payload.sort((a,b) => (a.full_name || '').localeCompare(b.full_name || '')) };
    case 'ADD_PROFILE_SUCCESS': return { ...state, profiles: [...state.profiles, action.payload].sort((a,b) => (a.full_name || '').localeCompare(b.full_name || '')) };
    case 'UPDATE_PROFILE_SUCCESS': return { ...state, profiles: state.profiles.map(p => p.id === action.payload.id ? action.payload : p).sort((a,b) => (a.full_name || '').localeCompare(b.full_name || '')) };
    case 'DELETE_PROFILE_SUCCESS': return { ...state, profiles: state.profiles.filter(p => p.id !== action.payload).sort((a,b) => (a.full_name || '').localeCompare(b.full_name || '')) };
    case 'SET_LOADING_PROFILES': return { ...state, isLoadingProfiles: action.payload };

    case 'SET_CART': return { ...state, cart: action.payload };
    case 'ADD_TO_CART':
    case 'ADD_RAW_CART_ITEM_SUCCESS':
        const existingItemIndex = state.cart.findIndex(
            item =>
            item.menuItemId === action.payload.menuItemId &&
            item.selectedSize?.id === action.payload.selectedSize?.id &&
            item.selectedCrust?.id === action.payload.selectedCrust?.id &&
            item.isHalfAndHalf === action.payload.isHalfAndHalf &&
            (!item.isHalfAndHalf ||
                (item.firstHalfFlavor?.menuItemId === action.payload.firstHalfFlavor?.menuItemId &&
                item.secondHalfFlavor?.menuItemId === action.payload.secondHalfFlavor?.menuItemId))
        );
        if (existingItemIndex > -1) {
            const updatedCart = [...state.cart];
            updatedCart[existingItemIndex].quantity += action.payload.quantity;
            return { ...state, cart: updatedCart };
        }
        return { ...state, cart: [...state.cart, action.payload] };
    case 'REMOVE_FROM_CART': return { ...state, cart: state.cart.filter(item => item.id !== action.payload) };
    case 'UPDATE_CART_QUANTITY':
        return { ...state, cart: state.cart.map(item => item.id === action.payload.cartItemId ? { ...item, quantity: Math.max(0, action.payload.quantity) } : item).filter(item => item.quantity > 0) };
    case 'CLEAR_CART': return { ...state, cart: [], customerDetails: null };
    case 'SET_CUSTOMER_DETAILS': return { ...state, customerDetails: action.payload };
    case 'SET_ALERT': return { ...state, alert: action.payload };
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_AUTH_LOADING': return { ...state, authLoading: action.payload };
    case 'SET_ACTIVE_CASH_SESSION': return { ...state, activeCashSession: action.payload };
    case 'SET_CASH_SESSIONS': return { ...state, cashSessions: action.payload.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()) };
    case 'ADD_CASH_SESSION_SUCCESS':
        const filteredSessionsAdd = state.cashSessions.filter(cs => cs.id !== action.payload.id);
        return { ...state, cashSessions: [action.payload, ...filteredSessionsAdd].sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()), activeCashSession: action.payload.status === CashRegisterSessionStatus.OPEN ? action.payload : state.activeCashSession };
    case 'UPDATE_CASH_SESSION_SUCCESS':
        const filteredSessionsUpdate = state.cashSessions.filter(cs => cs.id !== action.payload.id);
        return { ...state, cashSessions: [action.payload, ...filteredSessionsUpdate].sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()), activeCashSession: action.payload.status === CashRegisterSessionStatus.OPEN ? action.payload : (state.activeCashSession?.id === action.payload.id ? null : state.activeCashSession) };
    case 'SET_CASH_ADJUSTMENTS': return { ...state, cashAdjustments: action.payload.sort((a, b) => new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime()) };
    case 'ADD_CASH_ADJUSTMENT_SUCCESS': 
        return { ...state, cashAdjustments: [action.payload, ...state.cashAdjustments].sort((a, b) => new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime()) };
    case 'SET_CURRENT_USER': return { ...state, currentUser: action.payload };
    case 'SET_CURRENT_PROFILE': return { ...state, currentProfile: action.payload };
    case 'SET_CASH_ADJUSTMENTS_TABLE_MISSING': return { ...state, cashAdjustmentsTableMissing: action.payload };
    
    case 'FETCH_SETTINGS_START':
    case 'UPDATE_SETTINGS_START':
      return { ...state, isLoadingSettings: true, settingsError: null };
    case 'FETCH_SETTINGS_SUCCESS':
    case 'UPDATE_SETTINGS_SUCCESS':
      const newSettings = action.payload;
      const parsedHours = newSettings.store?.opening_hours ? parseOpeningHours(newSettings.store.opening_hours) : undefined;
      const isOpen = isStoreOpen(parsedHours, newSettings.store?.store_timezone);
      return { ...state, settings: { ...newSettings, parsedOpeningHours: parsedHours }, isLoadingSettings: false, settingsError: null, isStoreOpenNow: isOpen };
    case 'FETCH_SETTINGS_FAILURE':
    case 'UPDATE_SETTINGS_FAILURE':
      return { ...state, isLoadingSettings: false, settingsError: action.payload };
    case 'SET_SETTINGS_TABLE_MISSING':
        return { ...state, settingsTableMissing: action.payload };
    case 'SET_PREFILLED_CUSTOMER_FOR_ORDER': return { ...state, prefilledCustomerForOrder: action.payload };
    case 'SET_SHOULD_OPEN_MANUAL_ORDER_MODAL': return { ...state, shouldOpenManualOrderModal: action.payload };
    case 'SET_IS_STORE_OPEN_NOW': return { ...state, isStoreOpenNow: action.payload };
    case 'SET_DIRECT_ORDER_PROFILE': return { ...state, directOrderProfile: action.payload };
    case 'SET_PASSWORD_RECOVERY_SESSION': return { ...state, passwordRecoverySession: action.payload };
    case 'CLEAR_PASSWORD_RECOVERY_SESSION': return { ...state, passwordRecoverySession: null };
    case 'SET_IS_DEVELOPER_ADMIN': return { ...state, isDeveloperAdmin: action.payload };
    default: return state;
  }
};

// --- Context Props Interface ---
interface AppContextProps extends AppState {
  dispatch: React.Dispatch<Action>;
  addCategory: (name: string) => Promise<Category | null>;
  updateCategory: (category: Category) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'created_at'>) => Promise<MenuItem | null>;
  updateMenuItem: (item: MenuItem) => Promise<MenuItem | null>;
  deleteMenuItem: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, manual?: boolean) => Promise<void>;
  forceCheckOrderTransitions: () => void;
  toggleOrderAutoProgress: (orderId: string) => void;
  createManualOrder: (orderData: ManualOrderData) => Promise<Order | null>;
  addItemsToOrder: (orderId: string, newCartItems: CartItem[]) => Promise<Order | null>;
  fetchOrderWithItems: (orderId: string) => Promise<Order | null>;
  addTable: (tableData: Omit<Table, 'id' | 'status' | 'created_at'>) => Promise<Table | null>;
  updateTable: (tableData: Partial<Table> & { id: string }) => Promise<Table | null>;
  deleteTable: (id: string) => Promise<void>;
  
  addToCart: (item: MenuItem, quantity?: number) => void;
  addRawCartItem: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerDetails: (details: CustomerDetails | null) => void;
  placeOrder: () => Promise<Order | null>;
  setAlert: (alertInfo: AlertInfo | null) => void;
  openCashRegister: (openingBalance: number, notes?: string) => Promise<CashRegisterSession | null>;
  closeCashRegister: (sessionId: string, closingBalanceInformed: number, notes?: string) => Promise<CashRegisterSession | null>;
  addCashAdjustment: (sessionId: string, type: CashAdjustmentType, amount: number, reason: string) => Promise<CashAdjustment | null>; 
  closeTableAccount: (orderId: string, paymentDetails: PaymentDetails) => Promise<Order | null>;
  fetchSettings: () => Promise<void>; 
  updateSettings: (newSettings: AppSettings) => Promise<boolean>; 
  
  // Re-added profile and auth related properties
  addProfile: (profileData: CustomerFormValues) => Promise<Profile | null>;
  updateProfile: (profileId: string, profileData: Partial<CustomerFormValues>) => Promise<Profile | null>;
  deleteProfile: (profileId: string) => Promise<boolean>;
  initiateOrderForCustomer: (profile: Profile) => void;
  signIn: (email: string, password: string) => Promise<SupabaseUser | null>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<SupabaseUser | null>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  updateUserPassword: (newPassword: string) => Promise<boolean>;
  clearDirectOrderProfile: () => void;
  clearPrefilledCustomerForOrder: () => void;
  fetchProfileById: (profileId: string) => Promise<Profile | null>;
}

// --- Context Creation ---
const AppContext = createContext<AppContextProps | undefined>(undefined);

// --- Provider Component ---
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const initialDataLoadedRef = useRef(false);
  const newOrderAudioRef = useRef<HTMLAudioElement | null>(null);


  const setAlertCb = useCallback((alertInfo: AlertInfo | null) => {
    dispatch({ type: 'SET_ALERT', payload: alertInfo });
  }, []);

  const getOrderStatusDuration = useCallback((orderType: OrderType | undefined, status: OrderStatus): number => {
    const flowSettings = state.settings?.order_flow;
    const defaultFlowSettings = defaultAppSettings.order_flow;

    if (orderType && flowSettings && flowSettings[orderType] && flowSettings[orderType]![status] !== undefined) {
      return flowSettings[orderType]![status]!;
    }
    if (orderType && defaultFlowSettings[orderType] && defaultFlowSettings[orderType]![status] !== undefined) {
        console.warn(`[AppContext] Duration for ${orderType}/${status} not in custom settings, using default type-specific duration.`);
        return defaultFlowSettings[orderType]![status]!;
    }
    console.warn(`[AppContext] Duration for ${orderType}/${status} not in settings, using hardcoded default (0ms or general default).`);
    return defaultAppSettings.order_flow[OrderType.BALCAO][status] || 0; 
  }, [state.settings]);


  // --- Data Mapping ---
  const mapRawCategoryToCategory = (raw: RawCategory): Category => ({ ...raw });
  const mapRawMenuItemToMenuItem = (raw: RawMenuItem): MenuItem => ({ ...raw, send_to_kitchen: raw.send_to_kitchen ?? true, sizes: raw.sizes || undefined, allow_half_and_half: raw.allow_half_and_half || undefined });
  const mapRawTableToTable = (raw: RawTable): Table => ({ ...raw });
  const mapRawOrderToOrder = (raw: RawOrder, items: OrderItem[] = []): Order => ({ ...raw, items, customer_id: raw.customer_id || null });
  const mapRawOrderItemToOrderItem = (raw: RawOrderItem): OrderItem => ({ ...raw });
  const mapRawCashRegisterSessionToCashRegisterSession = (raw: RawCashRegisterSession): CashRegisterSession => ({ ...raw });
  const mapRawCashAdjustmentToCashAdjustment = (raw: RawCashAdjustment): CashAdjustment => ({ ...raw }); 


  // --- Data Fetching Callbacks ---
  const fetchOrderWithItemsCb = useCallback(async (orderId: string): Promise<Order | null> => {
    console.log(`[fetchOrderWithItemsCb] Processing orderId: ${orderId}`);
    try {
        const { data: orderData, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (orderError || !orderData) { handleSupabaseError({ error: orderError, customMessage: `Falha ao buscar pedido ${orderId}` }); return null; }
        const { data: itemsData, error: itemsError } = await supabase.from('order_items').select('*').eq('order_id', orderId);
        console.log(`[fetchOrderWithItemsCb] Raw itemsData for ${orderId}:`, JSON.parse(JSON.stringify(itemsData || [])));
        if (itemsError) { handleSupabaseError({ error: itemsError, customMessage: `Falha ao buscar itens do pedido ${orderId}` });}
        return mapRawOrderToOrder(orderData as RawOrder, getArray(itemsData).map(mapRawOrderItemToOrderItem));
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [setAlertCb]);

  // --- CRUD and Action Functions ---
  const addCategory = useCallback(async (name: string): Promise<Category | null> => {
    try {
        const { data, error } = await supabase.from('categories').insert({ name }).select().single();
        if (error || !data) { handleSupabaseError({ error, customMessage: "Falha ao adicionar categoria" }); return null; }
        const newCategory = mapRawCategoryToCategory(data as RawCategory);
        dispatch({ type: 'ADD_CATEGORY_SUCCESS', payload: newCategory });
        setAlertCb({ message: `Categoria "${newCategory.name}" adicionada!`, type: 'success' });
        return newCategory;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [setAlertCb]);

  const updateCategory = useCallback(async (category: Category): Promise<Category | null> => {
    try {
        const { data, error } = await supabase.from('categories').update({ name: category.name }).eq('id', category.id).select().single();
        if (error || !data) { handleSupabaseError({ error, customMessage: "Falha ao atualizar categoria" }); return null; }
        const updatedCategory = mapRawCategoryToCategory(data as RawCategory);
        dispatch({ type: 'UPDATE_CATEGORY_SUCCESS', payload: updatedCategory });
        setAlertCb({ message: `Categoria "${updatedCategory.name}" atualizada!`, type: 'success' });
        return updatedCategory;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [setAlertCb]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
        const { error: menuItemsError } = await supabase.from('menu_items').delete().eq('category_id', id);
        if (menuItemsError) { handleSupabaseError({ error: menuItemsError, customMessage: "Falha ao excluir itens da categoria." }); return; }
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) { handleSupabaseError({ error, customMessage: "Falha ao excluir categoria" }); return; }
        dispatch({ type: 'DELETE_CATEGORY_SUCCESS', payload: id });
        setAlertCb({ message: 'Categoria e seus itens excluídos!', type: 'success' });
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); }
  }, [setAlertCb]);

  const addMenuItem = useCallback(async (itemData: Omit<MenuItem, 'id' | 'created_at'>): Promise<MenuItem | null> => {
    try {
        const payload = { ...itemData, sizes: itemData.item_type === 'pizza' ? itemData.sizes : null, allow_half_and_half: itemData.item_type === 'pizza' ? itemData.allow_half_and_half : null };
        const { data, error } = await supabase.from('menu_items').insert(payload).select().single();
        if (error || !data) { handleSupabaseError({ error, customMessage: "Falha ao adicionar item" }); return null; }
        const newMenuItem = mapRawMenuItemToMenuItem(data as RawMenuItem);
        dispatch({ type: 'ADD_MENU_ITEM_SUCCESS', payload: newMenuItem });
        setAlertCb({ message: `Item "${newMenuItem.name}" adicionado!`, type: 'success' });
        return newMenuItem;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [setAlertCb]);

  const updateMenuItem = useCallback(async (itemData: MenuItem): Promise<MenuItem | null> => {
     try {
        const { id, created_at, ...updateData } = itemData;
        const payload = { ...updateData, sizes: updateData.item_type === 'pizza' ? updateData.sizes : null, allow_half_and_half: updateData.item_type === 'pizza' ? updateData.allow_half_and_half : null };
        const { data, error } = await supabase.from('menu_items').update(payload).eq('id', id).select().single();
        if (error || !data) { handleSupabaseError({ error, customMessage: "Falha ao atualizar item" }); return null; }
        const updatedItem = mapRawMenuItemToMenuItem(data as RawMenuItem);
        dispatch({ type: 'UPDATE_MENU_ITEM_SUCCESS', payload: updatedItem });
        setAlertCb({ message: `Item "${updatedItem.name}" atualizado!`, type: 'success' });
        return updatedItem;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [setAlertCb]);

  const deleteMenuItem = useCallback(async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (error) {
            // This will throw and propagate, preventing dispatch/success alert if Supabase returns an error
            handleSupabaseError({ error, customMessage: "Falha ao excluir item" }); 
            return; 
        }
        // If no error from Supabase, proceed with optimistic update
        dispatch({ type: 'DELETE_MENU_ITEM_SUCCESS', payload: id });
        setAlertCb({ message: 'Item excluído!', type: 'success' });
    } catch (e: any) { // Catch any other unexpected errors
        // Log the unexpected error
        console.error("Unexpected error in deleteMenuItem:", e);
        // Set an alert for the user
        const errorMessage = e?.message || "Ocorreu um erro inesperado ao tentar excluir o item.";
        setAlertCb({ message: errorMessage, type: 'error' });
        // Re-throw the error to ensure the calling code (MenuItemForm) knows about the failure
        throw e; 
    }
  }, [setAlertCb]);

  const addTable = useCallback(async (tableData: Omit<Table, 'id' | 'status' | 'created_at'>): Promise<Table | null> => {
    try {
        const payload = { ...tableData, status: TableStatus.AVAILABLE };
        const { data, error } = await supabase.from('tables').insert(payload).select().single();
        if (error || !data) { handleSupabaseError({ error, customMessage: "Falha ao adicionar mesa" }); return null; }
        const newTable = mapRawTableToTable(data as RawTable);
        dispatch({ type: 'ADD_TABLE_SUCCESS', payload: newTable });
        setAlertCb({ message: `Mesa "${newTable.name}" adicionada!`, type: 'success' });
        return newTable;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [setAlertCb]);

  const updateTable = useCallback(async (tableData: Partial<Table> & { id: string }): Promise<Table | null> => {
    const { id, ...updatePayload } = tableData;
    if (updatePayload.status === TableStatus.NEEDS_CLEANING) {
        const currentTableState = state.tables.find(t => t.id === id);
        if (currentTableState?.current_order_id) {
            const order = state.orders.find(o => o.id === currentTableState.current_order_id);
            if (order && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
                const msg = `A mesa "${currentTableState.name}" não pode ser marcada para limpeza. O pedido atual (${order.status}) precisa ser finalizado.`;
                setAlertCb({ message: msg, type: 'error'}); return state.tables.find(t => t.id === id) || null;
            }
        }
    }
    try {
        const { data, error } = await supabase.from('tables').update(updatePayload).eq('id', id).select().single();
        if (error || !data) { handleSupabaseError({ error, customMessage: "Falha ao atualizar mesa" }); return null; }
        const updatedTable = mapRawTableToTable(data as RawTable);
        dispatch({ type: 'UPDATE_TABLE_SUCCESS', payload: updatedTable });
        setAlertCb({ message: `Mesa "${updatedTable.name}" atualizada para ${updatedTable.status}!`, type: 'success' });
        return updatedTable;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [setAlertCb, state.tables, state.orders]);

  const deleteTable = useCallback(async (id: string): Promise<void> => {
    try {
        const tableToDelete = state.tables.find(t => t.id === id);
        if (tableToDelete?.status === TableStatus.OCCUPIED && tableToDelete.current_order_id) {
            setAlertCb({ message: `Não é possível excluir a mesa "${tableToDelete.name}" pois está ocupada.`, type: 'error'}); return;
        }
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (error) { handleSupabaseError({ error, customMessage: "Falha ao excluir mesa" }); return; }
        dispatch({ type: 'DELETE_TABLE_SUCCESS', payload: id });
        setAlertCb({ message: 'Mesa excluída!', type: 'success' });
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); }
  }, [setAlertCb, state.tables]);


  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus, manual: boolean = false): Promise<void> => {
    const orderToUpdate = state.orders.find(o => o.id === id);
    if (!orderToUpdate) { setAlertCb({ message: `Pedido ${id} não encontrado.`, type: 'error' }); return; }
    if (orderToUpdate.order_type === OrderType.MESA && status === OrderStatus.DELIVERED && manual) {
        setAlertCb({ message: "Pedidos de mesa devem ser finalizados pela tela de Mesas.", type: 'info' }); return;
    }

    const duration = getOrderStatusDuration(orderToUpdate.order_type, status);
    let updates: Partial<Order> = { status, last_status_change_time: new Date().toISOString() };

    if (manual) {
        if (status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED || (orderToUpdate.order_type === OrderType.MESA && status === OrderStatus.READY_FOR_PICKUP)) {
            updates.auto_progress = false; updates.next_auto_transition_time = null; updates.current_progress_percent = 100;
            if(orderToUpdate.order_type === OrderType.MESA && status === OrderStatus.READY_FOR_PICKUP) setAlertCb({ message: `Pedido da Mesa ${state.tables.find(t => t.id === orderToUpdate.table_id)?.name || orderToUpdate.table_id} pronto! Aguardando fechamento.`, type: 'info' });
        } else {
            updates.auto_progress = duration > 0;
            updates.next_auto_transition_time = duration > 0 ? new Date(Date.now() + duration).toISOString() : null;
            updates.current_progress_percent = 0;
            if (duration === 0) { updates.current_progress_percent = 100; }
        }
    } else { 
         updates.current_progress_percent = 0; 
         updates.next_auto_transition_time = duration > 0 ? new Date(Date.now() + duration).toISOString() : null;
         updates.auto_progress = duration > 0; 
         if (duration === 0) { updates.current_progress_percent = 100;}

         if (orderToUpdate.order_type === OrderType.MESA && status === OrderStatus.READY_FOR_PICKUP) {
            updates.auto_progress = false; updates.next_auto_transition_time = null; updates.current_progress_percent = 100;
            setAlertCb({ message: `Pedido da Mesa ${state.tables.find(t => t.id === orderToUpdate.table_id)?.name || orderToUpdate.table_id} pronto! Aguardando fechamento.`, type: 'info' });
         }
    }
    try {
        console.log(`[AppContext] updateOrderStatus: Updating order ${id} with`, updates);
        const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
        if (error || !data) { handleSupabaseError({ error, customMessage: "Falha ao atualizar status do pedido" }); return; }
        const updatedOrderData = await fetchOrderWithItemsCb(id);
        if (updatedOrderData) dispatch({ type: 'UPDATE_ORDER_STATUS_SUCCESS', payload: updatedOrderData });
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); }
  }, [state.orders, state.tables, setAlertCb, fetchOrderWithItemsCb, getOrderStatusDuration]);
  
  const checkOrderTransitions = useCallback(async () => {
    if (!state.settings) return; 

    for (const order of state.orders) {
        if (order.auto_progress && order.next_auto_transition_time && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
            const now = Date.now(); const nextTransitionTime = new Date(order.next_auto_transition_time).getTime();
            const totalDuration = getOrderStatusDuration(order.order_type, order.status);
            const timeElapsed = totalDuration - (nextTransitionTime - now);
            let currentProgress = totalDuration > 0 ? Math.min(100, Math.max(0, (timeElapsed / totalDuration) * 100)) : (nextTransitionTime <= now ? 100 : 0);
            
            if (now >= nextTransitionTime) {
                const nextStatus = ORDER_PROGRESSION_SEQUENCE[order.status];
                if (nextStatus) {
                    if (order.order_type === OrderType.MESA && nextStatus === OrderStatus.READY_FOR_PICKUP) {
                        await updateOrderStatus(order.id, OrderStatus.READY_FOR_PICKUP, false);
                    } else if (nextStatus === OrderStatus.OUT_FOR_DELIVERY && order.order_type !== OrderType.DELIVERY) {
                        await updateOrderStatus(order.id, OrderStatus.DELIVERED, false);
                    } else {
                        await updateOrderStatus(order.id, nextStatus, false);
                    }
                } else {
                    await supabase.from('orders').update({ auto_progress: false, current_progress_percent: 100 }).eq('id', order.id);
                    const updatedOrderData = await fetchOrderWithItemsCb(order.id); if (updatedOrderData) dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: { eventType: 'UPDATE', new: updatedOrderData } });
                }
            } else {
                const currentDBProgress = order.current_progress_percent || 0;
                if (Math.abs(currentProgress - currentDBProgress) > 5 || (currentProgress === 100 && currentDBProgress !== 100) || (currentProgress === 0 && currentDBProgress !== 0) ) {
                    const { error: progressError } = await supabase.from('orders').update({ current_progress_percent: Math.round(currentProgress) }).eq('id', order.id);
                    if (!progressError) { dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: { eventType: 'UPDATE', new: { ...order, current_progress_percent: Math.round(currentProgress) } } }); }
                } else if (currentProgress !== order.current_progress_percent) { 
                    dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: { eventType: 'UPDATE', new: { ...order, current_progress_percent: Math.round(currentProgress) } } });
                }
            }
        }
    }
  }, [state.orders, state.settings, updateOrderStatus, fetchOrderWithItemsCb, getOrderStatusDuration]);

  const toggleOrderAutoProgress = useCallback(async (orderId: string) => {
    const order = state.orders.find(o => o.id === orderId); if (!order || !state.settings) return;

    if (!order.auto_progress && order.order_type === OrderType.MESA && order.status === OrderStatus.READY_FOR_PICKUP) {
        setAlertCb({ message: "Este pedido de mesa aguarda fechamento manual.", type: 'info' });
        if(order.auto_progress !== false) { await supabase.from('orders').update({ auto_progress: false, next_auto_transition_time: null, current_progress_percent: 100 }).eq('id', orderId); const updatedOrder = await fetchOrderWithItemsCb(orderId); if (updatedOrder) dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: {eventType: 'UPDATE', new: updatedOrder} }); } return;
    }
    
    const newAutoProgressState = !order.auto_progress;
    let updates: Partial<Order> = { auto_progress: newAutoProgressState };
    const duration = getOrderStatusDuration(order.order_type, order.status);

    if (newAutoProgressState) { 
        updates.last_status_change_time = new Date().toISOString();
        if (duration > 0) {
            updates.next_auto_transition_time = new Date(Date.now() + duration).toISOString();
            updates.current_progress_percent = 0;
        } else { 
            updates.auto_progress = false; 
            updates.next_auto_transition_time = null;
            updates.current_progress_percent = 100;
            setAlertCb({ message: `Progresso automático não pode ser ativado para o status atual "${order.status}".`, type: 'info' });
        }
    } else { 
        updates.next_auto_transition_time = null;
    }

    try {
        const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
        if (error) { handleSupabaseError({ error, customMessage: "Falha ao alternar progresso." }); }
        else { const updatedOrder = await fetchOrderWithItemsCb(orderId); if (updatedOrder) dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: {eventType: 'UPDATE', new: updatedOrder} }); }
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); }
  }, [state.orders, state.settings, setAlertCb, fetchOrderWithItemsCb, getOrderStatusDuration]);

  const triggerPrintWindows = (orderToPrint: Order) => {
    try {
      sessionStorage.setItem('printOrder_' + orderToPrint.id, JSON.stringify(orderToPrint));
      const printBaseUrl = `${window.location.origin}${window.location.pathname}`;
      
      const kitchenWindow = window.open(`${printBaseUrl}?view=print&orderId=${orderToPrint.id}&printType=kitchen`, '_blank', 'width=400,height=600');
      if (!kitchenWindow) {
        setAlertCb({ message: "Falha ao abrir janela de impressão da cozinha. Verifique bloqueadores de pop-up.", type: "error" });
      }
      
      const orderWindow = window.open(`${printBaseUrl}?view=print&orderId=${orderToPrint.id}&printType=order`, '_blank', 'width=400,height=600');
      if (!orderWindow) {
         setAlertCb({ message: "Falha ao abrir janela de impressão do pedido. Verifique bloqueadores de pop-up.", type: "error" });
      }
    } catch (error) {
      console.error("Error opening print windows:", error);
      setAlertCb({ message: `Erro ao tentar abrir janelas de impressão: ${(error as Error).message}`, type: "error" });
    }
  };


  const createManualOrder = useCallback(async (orderData: ManualOrderData): Promise<Order | null> => {
    if (!state.settings) {
        setAlertCb({ message: "Configurações não carregadas. Não é possível criar pedido.", type: 'error'});
        return null;
    }
    let customerNameForOrder = orderData.customerName;
    if (orderData.orderType === OrderType.MESA && !orderData.customerName.trim()) {
        const tableName = state.tables.find(t => t.id === orderData.tableId)?.name || orderData.tableId;
        customerNameForOrder = `Mesa ${tableName || 'Desconhecida'}`;
    }
    
    const customerProfileId: string | null = null; 


    const orderItemsToInsert: Omit<RawOrderItem, 'id' | 'order_id' | 'created_at'>[] = orderData.items.map(item => ({ menu_item_id: item.menuItemId, quantity: item.quantity, name: item.name, price: item.price, selected_size_id: item.selectedSize?.id, selected_crust_id: item.selectedCrust?.id, is_half_and_half: item.isHalfAndHalf, first_half_flavor: item.firstHalfFlavor, second_half_flavor: item.secondHalfFlavor }));
    const totalAmount = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let activeSessionId: string | null = null;
    if (orderData.orderType !== OrderType.MESA && (orderData.paymentMethod === PaymentMethod.DINHEIRO || orderData.paymentMethod === PaymentMethod.PIX)) {
        if (state.activeCashSession) activeSessionId = state.activeCashSession.id;
        else setAlertCb({message: "Nenhum caixa aberto para registrar pagamento. Pedido criado sem vínculo a sessão.", type: "info"});
    }

    const initialStatus = OrderStatus.PENDING;
    const initialDuration = getOrderStatusDuration(orderData.orderType, initialStatus);
    const nowTime = Date.now();

    const newRawOrder: Omit<RawOrder, 'id' | 'created_at' | 'order_time' | 'last_status_change_time'> = { 
        customer_name: customerNameForOrder, 
        customer_phone: orderData.customerPhone, 
        customer_address: orderData.orderType === OrderType.DELIVERY ? orderData.customerAddress : undefined,
        total_amount: totalAmount, 
        status: initialStatus, 
        notes: orderData.addressReference ? `${orderData.notes || ''} (Ref: ${orderData.addressReference})`.trim() : orderData.notes, 
        order_type: orderData.orderType, 
        table_id: orderData.orderType === OrderType.MESA ? orderData.tableId : undefined,
        payment_method: orderData.orderType !== OrderType.MESA ? orderData.paymentMethod : null, 
        amount_paid: orderData.orderType !== OrderType.MESA && orderData.paymentMethod === PaymentMethod.DINHEIRO ? orderData.amountPaid : null, 
        change_due: orderData.orderType !== OrderType.MESA && orderData.paymentMethod === PaymentMethod.DINHEIRO && orderData.amountPaid && orderData.amountPaid >= totalAmount ? orderData.amountPaid - totalAmount : null, 
        auto_progress: initialDuration > 0, 
        current_progress_percent: 0, 
        next_auto_transition_time: initialDuration > 0 ? new Date(nowTime + initialDuration).toISOString() : null,
        cash_register_session_id: activeSessionId, 
        customer_id: customerProfileId 
    };
    try {
        const { data: createdOrderData, error: orderInsertError } = await supabase.from('orders').insert(newRawOrder).select().single();
        if (orderInsertError || !createdOrderData) { handleSupabaseError({ error: orderInsertError, customMessage: "Falha ao criar pedido manual." }); return null; }
        const itemsWithOrderId = orderItemsToInsert.map(item => ({ ...item, order_id: createdOrderData.id }));
        const { error: itemsInsertError } = await supabase.from('order_items').insert(itemsWithOrderId);
        if (itemsInsertError) { await supabase.from('orders').delete().eq('id', createdOrderData.id); handleSupabaseError({ error: itemsInsertError, customMessage: "Falha ao inserir itens. Pedido revertido." }); return null; }
        if (orderData.orderType === OrderType.MESA && orderData.tableId) {
            const targetTable = state.tables.find(t => t.id === orderData.tableId);
            if (targetTable?.status === TableStatus.AVAILABLE) await updateTable({ id: orderData.tableId, status: TableStatus.OCCUPIED, current_order_id: createdOrderData.id });
        }
        const finalOrder = await fetchOrderWithItemsCb(createdOrderData.id);
        if (finalOrder) { 
            setAlertCb({message: `Pedido para ${customerNameForOrder} criado!`, type: "success"}); 
            dispatch({ type: 'ADD_ORDER_SUCCESS', payload: finalOrder }); 
            triggerPrintWindows(finalOrder); // Trigger print
            return finalOrder; 
        } 
        return null;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [state.tables, state.activeCashSession, state.settings, setAlertCb, fetchOrderWithItemsCb, updateTable, getOrderStatusDuration]);

  const addItemsToOrder = useCallback(async (orderId: string, newCartItems: CartItem[]): Promise<Order | null> => {
    if (newCartItems.length === 0) { setAlertCb({ message: "Nenhum item para adicionar.", type: "info" }); return null; }
    if (!state.settings) { setAlertCb({ message: "Configurações não carregadas.", type: "error" }); return null; }
    
    try {
      const { data: existingOrderData, error: fetchError } = await supabase.from('orders').select('total_amount, status, order_type').eq('id', orderId).single();
      if (fetchError || !existingOrderData) { handleSupabaseError({ error: fetchError, customMessage: "Falha ao buscar pedido existente." }); return null; }
      if (existingOrderData.status === OrderStatus.DELIVERED || existingOrderData.status === OrderStatus.CANCELLED) { setAlertCb({ message: `Não é possível adicionar itens a um pedido que já está ${existingOrderData.status}.`, type: "error" }); return null; }

      const orderItemsToInsert: Omit<RawOrderItem, 'id' | 'created_at'>[] = newCartItems.map(item => ({ order_id: orderId, menu_item_id: item.menuItemId, quantity: item.quantity, name: item.name, price: item.price, selected_size_id: item.selectedSize?.id, selected_crust_id: item.selectedCrust?.id, is_half_and_half: item.isHalfAndHalf, first_half_flavor: item.firstHalfFlavor, second_half_flavor: item.secondHalfFlavor }));
      const { error: itemsInsertError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsInsertError) { handleSupabaseError({ error: itemsInsertError, customMessage: "Falha ao adicionar novos itens ao pedido." }); return null; }

      const newItemsTotal = newCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const updatedTotalAmount = existingOrderData.total_amount + newItemsTotal;
      
      const orderUpdates: Partial<RawOrder> = { 
        total_amount: updatedTotalAmount, 
        last_status_change_time: new Date().toISOString() 
      };
      
      const currentOrderType = existingOrderData.order_type as OrderType | undefined;
      const currentOrderStatus = existingOrderData.status as OrderStatus;

      if (currentOrderStatus === OrderStatus.PENDING || currentOrderStatus === OrderStatus.PREPARING) {
        const durationForCurrentStatus = getOrderStatusDuration(currentOrderType, currentOrderStatus);
        orderUpdates.auto_progress = durationForCurrentStatus > 0;
        orderUpdates.next_auto_transition_time = durationForCurrentStatus > 0 
            ? new Date(Date.now() + durationForCurrentStatus).toISOString() 
            : null;
        orderUpdates.current_progress_percent = 0;
      } else if (currentOrderStatus === OrderStatus.READY_FOR_PICKUP) {
        const preparingStatusDuration = getOrderStatusDuration(currentOrderType, OrderStatus.PREPARING);
        orderUpdates.status = OrderStatus.PREPARING;
        orderUpdates.auto_progress = preparingStatusDuration > 0;
        orderUpdates.next_auto_transition_time = preparingStatusDuration > 0
            ? new Date(Date.now() + preparingStatusDuration).toISOString()
            : null;
        orderUpdates.current_progress_percent = 0;
        setAlertCb({ message: `Novos itens adicionados. O pedido #${orderId.substring(0,6)} voltou para 'Em Preparo'.`, type: 'info'});
      }

      const { error: orderUpdateError } = await supabase.from('orders').update(orderUpdates).eq('id', orderId);
      if (orderUpdateError) { handleSupabaseError({ error: orderUpdateError, customMessage: "Falha ao atualizar o pedido." }); return null; }

      const updatedOrder = await fetchOrderWithItemsCb(orderId);
      if (updatedOrder) { 
          dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: { eventType: 'UPDATE', new: updatedOrder } }); 
          setAlertCb({ message: `${newCartItems.length} item(ns) adicionado(s) à comanda! O pedido foi atualizado.`, type: 'success' }); 
          triggerPrintWindows(updatedOrder); // Trigger print for added items via kitchen slip (full order reprint)
          return updatedOrder; 
      }
      return null;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [setAlertCb, fetchOrderWithItemsCb, state.settings, getOrderStatusDuration]);


  const addToCart = useCallback((item: MenuItem, quantity: number = 1) => {
    if (!state.isStoreOpenNow) {
      setAlertCb({ message: "A loja está fechada. Não é possível adicionar itens ao carrinho.", type: "info" });
      return;
    }
    if (!item.available) { setAlertCb({ message: `${item.name} está indisponível.`, type: 'info' }); return; }
    const cartItem: CartItem = { id: generateId(), menuItemId: item.id, name: item.name, price: item.price, quantity: quantity, imageUrl: item.image_url, itemType: item.item_type };
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  }, [setAlertCb, state.isStoreOpenNow]);

  const addRawCartItem = useCallback((item: CartItem) => {
     if (!state.isStoreOpenNow) {
      setAlertCb({ message: "A loja está fechada. Não é possível adicionar itens ao carrinho.", type: "info" });
      return;
    }
    dispatch({ type: 'ADD_RAW_CART_ITEM_SUCCESS', payload: item });
  }, [state.isStoreOpenNow, setAlertCb]);

  const removeFromCart = useCallback((cartItemId: string) => dispatch({ type: 'REMOVE_FROM_CART', payload: cartItemId }), []);
  const updateCartQuantity = useCallback((cartItemId: string, quantity: number) => dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { cartItemId, quantity } }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const setCustomerDetailsCb = useCallback((details: CustomerDetails | null) => dispatch({ type: 'SET_CUSTOMER_DETAILS', payload: details }), []);


  const placeOrder = useCallback(async (): Promise<Order | null> => {
     if (!state.isStoreOpenNow) {
        setAlertCb({ message: "A loja está fechada. Não é possível realizar pedidos.", type: "error" });
        return null;
     }
     if (!state.settings) { setAlertCb({message: "Configurações não carregadas.", type: "error"}); return null;}
     if (state.cart.length === 0) { setAlertCb({ message: 'Carrinho vazio.', type: 'info' }); return null; }
     if (!state.customerDetails?.name || !state.customerDetails?.phone || !state.customerDetails?.address) { setAlertCb({ message: 'Detalhes do cliente são obrigatórios.', type: 'error' }); return null; }
     
     const orderItems: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[] = state.cart.map(ci => ({ menu_item_id: ci.menuItemId, quantity: ci.quantity, name: ci.name, price: ci.price, selected_size_id: ci.selectedSize?.id, selected_crust_id: ci.selectedCrust?.id, is_half_and_half: ci.isHalfAndHalf, first_half_flavor: ci.firstHalfFlavor, second_half_flavor: ci.secondHalfFlavor }));
     const totalAmount = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
     
     const customerProfileIdToLink: string | null = null; 

    const initialStatus = OrderStatus.PENDING;
    const initialDuration = getOrderStatusDuration(OrderType.DELIVERY, initialStatus); 
    const nowTime = Date.now();

    const orderPayload: Omit<RawOrder, 'id' | 'created_at' | 'order_time' | 'last_status_change_time'> = { 
        customer_name: state.customerDetails.name, customer_phone: state.customerDetails.phone, customer_address: state.customerDetails.address, 
        customer_id: customerProfileIdToLink, total_amount: totalAmount, status: initialStatus, 
        notes: state.customerDetails.addressReference ? `${state.customerDetails.notes || ''} (Ref: ${state.customerDetails.addressReference})`.trim() : state.customerDetails.notes,
        auto_progress: initialDuration > 0, current_progress_percent: 0, 
        next_auto_transition_time: initialDuration > 0 ? new Date(nowTime + initialDuration).toISOString() : null,
        order_type: OrderType.DELIVERY 
    };
     try {
        const { data: newOrderData, error: orderError } = await supabase.from('orders').insert(orderPayload).select().single();
        if (orderError || !newOrderData) { handleSupabaseError({ error: orderError, customMessage: 'Falha ao criar pedido' }); return null; }
        const orderItemsWithOrderId = orderItems.map(item => ({ ...item, order_id: newOrderData.id }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItemsWithOrderId);
        if (itemsError) { await supabase.from('orders').delete().eq('id', newOrderData.id); handleSupabaseError({ error: itemsError, customMessage: 'Falha ao salvar itens. Pedido revertido.' }); return null; }
        const finalOrder = await fetchOrderWithItemsCb(newOrderData.id);
        if (finalOrder) { 
            dispatch({ type: 'ADD_ORDER_SUCCESS', payload: finalOrder }); 
            setAlertCb({ message: `Pedido #${finalOrder.id.substring(0,6)} realizado!`, type: 'success' }); 
            clearCart(); 
            triggerPrintWindows(finalOrder); // Trigger print
            return finalOrder; 
        } return null;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [state.cart, state.customerDetails, state.settings, state.isStoreOpenNow, setAlertCb, clearCart, fetchOrderWithItemsCb, getOrderStatusDuration]);

  const openCashRegister = useCallback(async (openingBalance: number, notes?: string): Promise<CashRegisterSession | null> => {
    if (state.activeCashSession) { setAlertCb({message: "Caixa já aberto.", type: "error"}); return null; }
    try {
        const payload = { opening_balance: openingBalance, notes_opening: notes, status: CashRegisterSessionStatus.OPEN, opened_at: new Date().toISOString() };
        const { data, error } = await supabase.from('cash_register_sessions').insert(payload).select().single();
        if (error || !data) { handleSupabaseError({error, customMessage: "Falha ao abrir caixa."}); return null; }
        const newSession = mapRawCashRegisterSessionToCashRegisterSession(data as RawCashRegisterSession);
        dispatch({ type: 'ADD_CASH_SESSION_SUCCESS', payload: newSession});
        setAlertCb({message: "Caixa aberto!", type: "success"}); return newSession;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: "error" }); return null; }
  }, [state.activeCashSession, setAlertCb]);

  const closeCashRegister = useCallback(async (sessionId: string, closingBalanceInformed: number, notes?: string): Promise<CashRegisterSession | null> => {
    const sessionToClose = state.cashSessions.find(s => s.id === sessionId);
    if (!sessionToClose || sessionToClose.status !== CashRegisterSessionStatus.OPEN) { setAlertCb({message: "Sessão não encontrada ou já fechada.", type: "error"}); return null; }
    
    const ordersInThisSession = state.orders.filter(o => o.cash_register_session_id === sessionId && o.status === OrderStatus.DELIVERED && (o.payment_method === PaymentMethod.DINHEIRO || o.payment_method === PaymentMethod.PIX));
    const calculatedSalesFromOrders = ordersInThisSession.reduce((sum, order) => sum + order.total_amount, 0);
    const adjustmentsForThisSession = state.cashAdjustments.filter(adj => adj.session_id === sessionId);
    const totalAddedAdjustments = adjustmentsForThisSession.filter(adj => adj.type === CashAdjustmentType.ADD).reduce((sum, adj) => sum + adj.amount, 0);
    const totalRemovedAdjustments = adjustmentsForThisSession.filter(adj => adj.type === CashAdjustmentType.REMOVE).reduce((sum, adj) => sum + adj.amount, 0);
    const expectedInCash = sessionToClose.opening_balance + calculatedSalesFromOrders + totalAddedAdjustments - totalRemovedAdjustments;
    const difference = closingBalanceInformed - expectedInCash;

    try {
        const payload = { closed_at: new Date().toISOString(), status: CashRegisterSessionStatus.CLOSED, closing_balance_informed: closingBalanceInformed, notes_closing: notes, calculated_sales: calculatedSalesFromOrders, expected_in_cash: expectedInCash, difference: difference };
        const { data, error } = await supabase.from('cash_register_sessions').update(payload).eq('id', sessionId).select().single();
        if (error || !data) { handleSupabaseError({error, customMessage: "Falha ao fechar caixa."}); return null; }
        const closedSession = mapRawCashRegisterSessionToCashRegisterSession(data as RawCashRegisterSession);
        dispatch({ type: 'UPDATE_CASH_SESSION_SUCCESS', payload: closedSession});
        setAlertCb({message: `Caixa fechado. Diferença: R$ ${difference.toFixed(2)}`, type: difference === 0 ? "success" : "info"}); return closedSession;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: "error" }); return null; }
  }, [state.cashSessions, state.orders, state.cashAdjustments, setAlertCb]);

  const addCashAdjustment = useCallback(async (sessionId: string, type: CashAdjustmentType, amount: number, reason: string): Promise<CashAdjustment | null> => {
    if (state.cashAdjustmentsTableMissing) { setAlertCb({ message: "A funcionalidade de ajuste de caixa está indisponível. Tabela 'cash_adjustments' não encontrada.", type: "error" }); return null; }
    if (amount <= 0) { setAlertCb({ message: "O valor do ajuste deve ser positivo.", type: "error" }); return null; }
    try {
        const payload: Omit<RawCashAdjustment, 'id' | 'created_at'> = { session_id: sessionId, type, amount, reason, adjusted_at: new Date().toISOString() };
        const { data, error } = await supabase.from('cash_adjustments').insert(payload).select().single();
        if (error || !data) { handleSupabaseError({ error, customMessage: "Falha ao adicionar ajuste ao caixa." }); return null; }
        const newAdjustment = mapRawCashAdjustmentToCashAdjustment(data as RawCashAdjustment);
        dispatch({ type: 'ADD_CASH_ADJUSTMENT_SUCCESS', payload: newAdjustment });
        setAlertCb({ message: `Ajuste de ${type === CashAdjustmentType.ADD ? 'entrada' : 'saída'} de R$ ${amount.toFixed(2)} registrado!`, type: "success" });
        return newAdjustment;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: "error" }); return null; }
  }, [setAlertCb, state.cashAdjustmentsTableMissing]);


  const closeTableAccount = useCallback(async (orderId: string, paymentDetails: PaymentDetails): Promise<Order | null> => {
    console.log('[AppContext] closeTableAccount called with orderId:', orderId, 'PaymentDetails:', paymentDetails);
    const orderToClose = state.orders.find(o => o.id === orderId);
    if (!orderToClose) { setAlertCb({message: `Pedido ${orderId} não encontrado.`, type: 'error'}); return null; }
    if (orderToClose.status === OrderStatus.DELIVERED || orderToClose.status === OrderStatus.CANCELLED) { setAlertCb({message: `Pedido ${orderId} já está ${orderToClose.status}.`, type: 'info'}); return orderToClose; }
    let activeSessionIdForOrder: string | null = null;
    if ((paymentDetails.paymentMethod === PaymentMethod.DINHEIRO || paymentDetails.paymentMethod === PaymentMethod.PIX) && state.activeCashSession) activeSessionIdForOrder = state.activeCashSession.id;
    const updates: Partial<Order> = { status: OrderStatus.DELIVERED, payment_method: paymentDetails.paymentMethod, amount_paid: paymentDetails.paymentMethod === PaymentMethod.DINHEIRO ? paymentDetails.amountPaid : orderToClose.total_amount, change_due: paymentDetails.paymentMethod === PaymentMethod.DINHEIRO && paymentDetails.amountPaid && paymentDetails.amountPaid >= orderToClose.total_amount ? paymentDetails.amountPaid - orderToClose.total_amount : 0, last_status_change_time: new Date().toISOString(), auto_progress: false, current_progress_percent: 100, cash_register_session_id: activeSessionIdForOrder };
    try {
        console.log(`[AppContext] Updating order ${orderId} to DELIVERED with payload:`, updates);
        const { data: updatedOrderData, error: orderUpdateError } = await supabase.from('orders').update(updates).eq('id', orderId).select().single();
        if (orderUpdateError || !updatedOrderData) { handleSupabaseError({ error: orderUpdateError, customMessage: "Falha ao fechar conta." }); return null; }
        const finalOrder = await fetchOrderWithItemsCb(orderId);
        if(finalOrder) {
            dispatch({ type: 'UPDATE_ORDER_STATUS_SUCCESS', payload: finalOrder });
            triggerPrintWindows(finalOrder); // Trigger print for table closing
        }
        if (orderToClose.table_id) {
            const tableUpdatePayload: Partial<Table> & {id: string} = { id: orderToClose.table_id, status: TableStatus.NEEDS_CLEANING };
            const currentTable = state.tables.find(t => t.id === orderToClose.table_id);
            if (currentTable?.current_order_id === orderId) tableUpdatePayload.current_order_id = null;
            console.log(`[AppContext] Updating table ${orderToClose.table_id} after closing order:`, tableUpdatePayload);
            await updateTable(tableUpdatePayload);
        }
        setAlertCb({message: `Conta do pedido ${orderId.substring(0,6)} fechada!`, type: 'success'}); return finalOrder || orderToClose;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [state.orders, state.activeCashSession, state.tables, setAlertCb, fetchOrderWithItemsCb, updateTable]);


  // --- Settings Functions ---
  const fetchSettings = useCallback(async () => {
    dispatch({ type: 'FETCH_SETTINGS_START' });
    try {
      const { data, error } = await supabase.from('app_settings').select('settings_data').eq('id', 'default_settings').single();
      if (error) {
        if (error.message.includes('relation "public.app_settings" does not exist')) {
            console.warn("[AppContext] Tabela 'app_settings' não encontrada. Usando padrões.");
            setAlertCb({ message: "Atenção: Tabela de configurações não encontrada. Usando padrões. Crie a tabela para salvar.", type: 'error' });
            const parsedHours = parseOpeningHours(defaultAppSettings.store.opening_hours);
            const isOpen = isStoreOpen(parsedHours, defaultAppSettings.store.store_timezone);
            dispatch({ type: 'FETCH_SETTINGS_SUCCESS', payload: { ...defaultAppSettings, parsedOpeningHours: parsedHours } });
            dispatch({ type: 'SET_IS_STORE_OPEN_NOW', payload: isOpen });
            dispatch({ type: 'SET_SETTINGS_TABLE_MISSING', payload: true }); return;
        } else if (error.code !== 'PGRST116') { 
            throw error; 
        }
      }
      dispatch({ type: 'SET_SETTINGS_TABLE_MISSING', payload: false });
      if (data && data.settings_data) {
        const fetched = data.settings_data as Partial<AppSettings>;
        const mergedSettings: AppSettings = {
            ...defaultAppSettings,
            ...fetched,
            id: 'default_settings',
            store: { ...defaultAppSettings.store, ...(fetched.store || {}) },
            payments: { ...defaultAppSettings.payments, ...(fetched.payments || {}) },
            whatsapp: { ...defaultAppSettings.whatsapp, ...(fetched.whatsapp || {}) },
            notifications: { ...defaultAppSettings.notifications, ...(fetched.notifications || {}) },
            order_flow: {
                [OrderType.MESA]: { ...defaultAppSettings.order_flow[OrderType.MESA], ...(fetched.order_flow?.[OrderType.MESA] || {}) },
                [OrderType.DELIVERY]: { ...defaultAppSettings.order_flow[OrderType.DELIVERY], ...(fetched.order_flow?.[OrderType.DELIVERY] || {}) },
                [OrderType.BALCAO]: { ...defaultAppSettings.order_flow[OrderType.BALCAO], ...(fetched.order_flow?.[OrderType.BALCAO] || {}) },
            },
            n8n_api_key: fetched.n8n_api_key !== undefined ? fetched.n8n_api_key : defaultAppSettings.n8n_api_key,
        };

        const parsedHours = parseOpeningHours(mergedSettings.store.opening_hours);
        const isOpen = isStoreOpen(parsedHours, mergedSettings.store.store_timezone);
        dispatch({ type: 'FETCH_SETTINGS_SUCCESS', payload: { ...mergedSettings, parsedOpeningHours: parsedHours } });
        dispatch({ type: 'SET_IS_STORE_OPEN_NOW', payload: isOpen });

      } else {
        const parsedHours = parseOpeningHours(defaultAppSettings.store.opening_hours);
        const isOpen = isStoreOpen(parsedHours, defaultAppSettings.store.store_timezone);
        dispatch({ type: 'FETCH_SETTINGS_SUCCESS', payload: { ...defaultAppSettings, parsedOpeningHours: parsedHours } });
        dispatch({ type: 'SET_IS_STORE_OPEN_NOW', payload: isOpen });
        if (!state.settingsTableMissing) {
            const { error: upsertError } = await supabase.from('app_settings').upsert({ id: 'default_settings', settings_data: defaultAppSettings });
            if (upsertError) { console.error("[AppContext] Falha ao salvar configurações padrão iniciais:", upsertError.message); }
        }
      }
    } catch (e) { 
        const errorMsg = (e as Error).message;
        dispatch({ type: 'FETCH_SETTINGS_FAILURE', payload: errorMsg }); 
        setAlertCb({ message: `Erro ao buscar configurações: ${errorMsg}`, type: 'error' });
    }
  }, [setAlertCb, state.settingsTableMissing]);

  const updateSettings = useCallback(async (newSettings: AppSettings): Promise<boolean> => {
    if (state.settingsTableMissing) {
        setAlertCb({ message: "Tabela 'app_settings' não existe. Crie-a para salvar.", type: 'error' }); return false;
    }
    dispatch({ type: 'UPDATE_SETTINGS_START' });
    try {
      const { parsedOpeningHours, ...settingsToSaveForDB } = newSettings;
      const payloadToSave = { id: 'default_settings', settings_data: settingsToSaveForDB, updated_at: new Date().toISOString() };
      
      const { error } = await supabase.from('app_settings').upsert(payloadToSave).eq('id', 'default_settings');
      if (error) {
        dispatch({ type: 'UPDATE_SETTINGS_FAILURE', payload: error.message });
        if (error.message.toLowerCase().includes("violates row-level security policy")) {
            setAlertCb({ message: `Falha RLS ao salvar: ${error.message}. Verifique permissões.`, type: 'error' });
        } else {
            setAlertCb({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
        }
        return false;
      }
      const reParsedHours = parseOpeningHours(newSettings.store.opening_hours);
      const isOpen = isStoreOpen(reParsedHours, newSettings.store.store_timezone);
      dispatch({ type: 'UPDATE_SETTINGS_SUCCESS', payload: { ...newSettings, parsedOpeningHours: reParsedHours } });
      dispatch({ type: 'SET_IS_STORE_OPEN_NOW', payload: isOpen });
      setAlertCb({ message: 'Configurações salvas!', type: 'success' });
      return true;
    } catch (e) {
      const errorMsg = (e as Error).message;
      dispatch({ type: 'UPDATE_SETTINGS_FAILURE', payload: errorMsg });
      setAlertCb({ message: `Erro ao salvar: ${errorMsg}`, type: 'error' });
      return false;
    }
  }, [setAlertCb, state.settingsTableMissing]);

  // --- Auth and Profile Placeholder Functions ---
  const addProfile = useCallback(async (profileData: CustomerFormValues): Promise<Profile | null> => {
    setAlertCb({ message: 'Profile add functionality not fully implemented.', type: 'info' });
    console.warn('addProfile called, but not fully implemented.', profileData);
    const newProfile: Profile = {
      id: generateId(),
      full_name: profileData.name,
      phone: profileData.phone,
      email: profileData.email,
      default_address: profileData.address,
      default_address_reference: profileData.addressReference,
      notes: profileData.notes,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PROFILE_SUCCESS', payload: newProfile });
    return newProfile;
  }, [setAlertCb]);

  const updateProfile = useCallback(async (profileId: string, profileData: Partial<CustomerFormValues>): Promise<Profile | null> => {
    setAlertCb({ message: 'Profile update functionality not fully implemented.', type: 'info' });
    console.warn('updateProfile called, but not fully implemented for ID:', profileId, profileData);
    const existingProfile = state.profiles.find(p => p.id === profileId);
    if (existingProfile) {
      const updated: Profile = {
        ...existingProfile,
        full_name: profileData.name ?? existingProfile.full_name,
        phone: profileData.phone ?? existingProfile.phone,
        email: profileData.email ?? existingProfile.email,
        default_address: profileData.address ?? existingProfile.default_address,
        default_address_reference: profileData.addressReference ?? existingProfile.default_address_reference,
        notes: profileData.notes ?? existingProfile.notes,
        updated_at: new Date().toISOString(),
      };
      dispatch({ type: 'UPDATE_PROFILE_SUCCESS', payload: updated });
      return updated;
    }
    return null;
  }, [setAlertCb, state.profiles]);

  const deleteProfile = useCallback(async (profileId: string): Promise<boolean> => {
    setAlertCb({ message: 'Profile delete functionality not fully implemented.', type: 'info' });
    console.warn('deleteProfile called, but not fully implemented for ID:', profileId);
    dispatch({ type: 'DELETE_PROFILE_SUCCESS', payload: profileId });
    return true;
  }, [setAlertCb]);

  const initiateOrderForCustomer = useCallback((profile: Profile) => {
    setAlertCb({ message: 'Initiate order for customer functionality not fully implemented.', type: 'info' });
    console.warn('initiateOrderForCustomer called with profile:', profile);
    dispatch({ type: 'SET_PREFILLED_CUSTOMER_FOR_ORDER', payload: profile });
    dispatch({ type: 'SET_SHOULD_OPEN_MANUAL_ORDER_MODAL', payload: true });
  }, [setAlertCb, dispatch]);

  const signIn = useCallback(async (email: string, password: string): Promise<SupabaseUser | null> => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    setAlertCb({ message: 'Sign in functionality not fully implemented.', type: 'info' });
    console.warn('signIn called with email:', email);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate error for now to prevent login without backend
    setAlertCb({ message: 'Falha no login (simulado). Esta função não está implementada.', type: 'error'});
    dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    return null; 
  }, [setAlertCb, dispatch]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone?:string ): Promise<SupabaseUser | null> => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    setAlertCb({ message: 'Sign up functionality not fully implemented.', type: 'info' });
    console.warn('signUp called with email:', email, 'fullName:', fullName, 'phone:', phone);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAlertCb({ message: 'Cadastro simulado com sucesso! Faça login.', type: 'success'});
    dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    return { id: generateId(), email, user_metadata: { full_name: fullName, phone } } as SupabaseUser; 
  }, [setAlertCb, dispatch]);

  const signOut = useCallback(async () => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    setAlertCb({ message: 'Sign out functionality not fully implemented.', type: 'info' });
    await new Promise(resolve => setTimeout(resolve, 500));
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
    dispatch({ type: 'SET_CURRENT_PROFILE', payload: null });
    dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    setAlertCb({ message: 'Logout simulado com sucesso.', type: 'success'});
  }, [setAlertCb, dispatch]);

  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    setAlertCb({ message: 'Sign in with Google not fully implemented.', type: 'info' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAlertCb({ message: 'Login com Google simulado. Verifique o console.', type: 'info'});
    dispatch({ type: 'SET_AUTH_LOADING', payload: false });
  }, [setAlertCb, dispatch]);

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    setAlertCb({ message: 'Password reset functionality not fully implemented.', type: 'info' });
    console.warn('requestPasswordReset called for email:', email);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAlertCb({ message: 'Se o email existir, um link de recuperação foi enviado (simulado).', type: 'success' });
    dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    return true;
  }, [setAlertCb, dispatch]);

  const updateUserPassword = useCallback(async (newPassword: string): Promise<boolean> => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    setAlertCb({ message: 'Update user password functionality not fully implemented.', type: 'info' });
    console.warn('updateUserPassword called with new password (length):', newPassword.length);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAlertCb({ message: 'Senha atualizada com sucesso (simulado)! Você será redirecionado.', type: 'success' });
    dispatch({ type: 'CLEAR_PASSWORD_RECOVERY_SESSION' });
    dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    return true; 
  }, [setAlertCb, dispatch]);

  const clearDirectOrderProfile = useCallback(() => {
    dispatch({ type: 'SET_DIRECT_ORDER_PROFILE', payload: null });
  }, [dispatch]);

  const clearPrefilledCustomerForOrder = useCallback(() => {
    dispatch({ type: 'SET_PREFILLED_CUSTOMER_FOR_ORDER', payload: null });
  }, [dispatch]);

  const fetchProfileById = useCallback(async (profileId: string): Promise<Profile | null> => {
    console.warn('fetchProfileById called with ID:', profileId, '- Not fully implemented, returning from state if exists.');
    const profile = state.profiles.find(p => p.id === profileId);
    return profile || null;
  }, [state.profiles]);
  // --- Effects ---
  const fetchInitialAdminData = useCallback(async () => {
    await fetchSettings(); 

    let cashAdjustmentsTableIsMissing = false;
    try {
        const [catRes, itemRes, tableRes, orderRes, cashSessRes] = await Promise.all([
            supabase.from('categories').select('*').order('name'),
            supabase.from('menu_items').select('*').order('name'),
            supabase.from('tables').select('*').order('name'),
            supabase.from('orders').select('*').order('order_time', { ascending: false }).limit(100),
            supabase.from('cash_register_sessions').select('*').order('opened_at', { ascending: false }),
        ]);

        if (catRes.error) handleSupabaseError({error: catRes.error, customMessage: "Falha ao carregar categorias"}); else dispatch({ type: 'SET_CATEGORIES', payload: getArray(catRes.data).map(mapRawCategoryToCategory) });
        if (itemRes.error) handleSupabaseError({error: itemRes.error, customMessage: "Falha ao carregar itens do cardápio"}); else dispatch({ type: 'SET_MENU_ITEMS', payload: getArray(itemRes.data).map(mapRawMenuItemToMenuItem) });
        if (tableRes.error) handleSupabaseError({error: tableRes.error, customMessage: "Falha ao carregar mesas"}); else dispatch({ type: 'SET_TABLES', payload: getArray(tableRes.data).map(mapRawTableToTable) });
        if (cashSessRes.error) handleSupabaseError({error: cashSessRes.error, customMessage: "Falha ao carregar sessões de caixa"}); else {
            const sessions = getArray(cashSessRes.data).map(mapRawCashRegisterSessionToCashRegisterSession);
            dispatch({ type: 'SET_CASH_SESSIONS', payload: sessions });
            dispatch({ type: 'SET_ACTIVE_CASH_SESSION', payload: sessions.find(s => s.status === CashRegisterSessionStatus.OPEN) || null });
        }
        
        const cashAdjRes = await supabase.from('cash_adjustments').select('*').order('adjusted_at', { ascending: false });
        if (cashAdjRes.error) {
            if (cashAdjRes.error.message.includes('relation "public.cash_adjustments" does not exist')) {
                console.warn("[AppContext] Tabela 'cash_adjustments' não encontrada.");
                setAlertCb({ message: "Atenção: Tabela 'cash_adjustments' não encontrada. Ajustes de caixa indisponíveis.", type: 'info' });
                dispatch({ type: 'SET_CASH_ADJUSTMENTS', payload: [] });
                dispatch({ type: 'SET_CASH_ADJUSTMENTS_TABLE_MISSING', payload: true });
                cashAdjustmentsTableIsMissing = true;
            } else { handleSupabaseError({error: cashAdjRes.error, customMessage: "Falha ao carregar ajustes de caixa"});}
        } else {
            dispatch({ type: 'SET_CASH_ADJUSTMENTS', payload: getArray(cashAdjRes.data).map(mapRawCashAdjustmentToCashAdjustment) });
            dispatch({ type: 'SET_CASH_ADJUSTMENTS_TABLE_MISSING', payload: false });
        }

        if (orderRes.error) handleSupabaseError({error: orderRes.error, customMessage: "Falha ao carregar pedidos"}); else {
             const rawOrders = getArray(orderRes.data) as RawOrder[];
             const ordersWithItemsPromises = rawOrders.map(ro => fetchOrderWithItemsCb(ro.id));
             const ordersWithItems = (await Promise.all(ordersWithItemsPromises)).filter(Boolean) as Order[];
             dispatch({ type: 'SET_ORDERS', payload: ordersWithItems });
        }

        // Attempt to load profiles
        dispatch({ type: 'SET_LOADING_PROFILES', payload: true });
        try {
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*');
            if (profileError) {
                if (profileError.message.includes('relation "public.profiles" does not exist')) {
                    console.warn("[AppContext] Tabela 'profiles' não encontrada.");
                    setAlertCb({ message: "Atenção: Tabela 'profiles' não encontrada. Gerenciamento de clientes pode não funcionar.", type: 'info' });
                    dispatch({ type: 'SET_PROFILES', payload: [] });
                } else {
                    handleSupabaseError({ error: profileError, customMessage: "Falha ao carregar perfis de clientes" });
                    dispatch({ type: 'SET_PROFILES', payload: [] });
                }
            } else {
                dispatch({ type: 'SET_PROFILES', payload: getArray(profileData).map(p => p as Profile) });
            }
        } catch (e) {
          setAlertCb({ message: `Erro ao buscar perfis: ${(e as Error).message}`, type: 'error' });
          dispatch({ type: 'SET_PROFILES', payload: [] });
        } finally {
            dispatch({ type: 'SET_LOADING_PROFILES', payload: false });
        }

    } catch (e) { 
        setAlertCb({ message: (e as Error).message, type: 'error' }); 
        console.warn("[AppContext] Erro ao buscar dados admin (tratado e alerta exibido):", e); 
    } 
    return cashAdjustmentsTableIsMissing;
  }, [setAlertCb, fetchOrderWithItemsCb, fetchSettings]);
  
  const fetchInitialCustomerData = useCallback(async () => {
    try {
        await fetchSettings(); 
        const [catRes, itemRes] = await Promise.all([
            supabase.from('categories').select('*').order('name'),
            supabase.from('menu_items').select('*').eq('available', true).order('name')
        ]);
        if (catRes.error) handleSupabaseError({error: catRes.error, customMessage: "Falha ao carregar categorias"}); else dispatch({ type: 'SET_CATEGORIES', payload: getArray(catRes.data).map(mapRawCategoryToCategory) });
        if (itemRes.error) handleSupabaseError({error: itemRes.error, customMessage: "Falha ao carregar itens do cardápio"}); else dispatch({ type: 'SET_MENU_ITEMS', payload: getArray(itemRes.data).map(mapRawMenuItemToMenuItem) });
    
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); throw e; }
  }, [setAlertCb, fetchSettings]);


  useEffect(() => { 
    const loadData = async () => {
      if (initialDataLoadedRef.current) {
        console.log(`[AppContext] Data Loader SKIPPED (already loaded): initialDataLoadedRef=${initialDataLoadedRef.current}`);
        return;
      }
      
      dispatch({ type: 'SET_LOADING', payload: true }); 
      console.log('[AppContext] Initial Data Loader STARTING...');

      const params = new URLSearchParams(window.location.search);
      const customerViewActive = params.get('view') === 'customer';
      const printViewActive = params.get('view') === 'print'; // Check for print view
      console.log(`[AppContext] Data Loader: customerViewActive=${customerViewActive}, printViewActive=${printViewActive}`);

      try {
        if (printViewActive) {
           // For print view, we only need settings, and order data will be from sessionStorage
           await fetchSettings();
        } else if (customerViewActive) {
          console.log('[AppContext] Fetching CUSTOMER data.');
          await fetchInitialCustomerData(); 
        } else { 
          console.log('[AppContext] Fetching ADMIN data (includes settings).');
          await fetchInitialAdminData(); 
        }
        initialDataLoadedRef.current = true;
        console.log('[AppContext] Data Loader FINISHED. initialDataLoadedRef=true.');
      } catch (error) {
          console.error('[AppContext] Erro GERAL durante carregamento inicial:', error);
          if (!state.alert) { setAlertCb({ message: `Erro ao carregar dados essenciais: ${(error as Error).message}`, type: 'error' }); }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('[AppContext] Data Loader: SET_LOADING to false.');
      }
    };
    loadData();
  }, [fetchInitialAdminData, fetchInitialCustomerData, fetchSettings, state.alert, setAlertCb]); 


  useEffect(() => { 
    if (initialDataLoadedRef.current && !state.isLoading) {
        console.log('[AppContext] Setting up Realtime subscriptions.');
        const ordersSubscription = supabase.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload: any) => { 
            console.log('Realtime order change:', payload); 
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') { 
                const changedOrder = await fetchOrderWithItemsCb((payload.new as RawOrder).id); 
                if (changedOrder) {
                    dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: { ...payload, new: changedOrder } }); 

                    if (payload.eventType === 'INSERT' && state.settings?.notifications.sound_alert_new_order_admin) {
                        const soundUrl = state.settings.notifications.sound_new_order_url;
                        if (soundUrl) {
                            if (newOrderAudioRef.current) {
                                newOrderAudioRef.current.pause();
                                newOrderAudioRef.current.currentTime = 0;
                                newOrderAudioRef.current.src = ''; 
                                newOrderAudioRef.current.load();   
                                newOrderAudioRef.current = null;   
                            }
                            try {
                                const audio = new Audio(soundUrl);
                                newOrderAudioRef.current = audio; 
                                newOrderAudioRef.current.play()
                                  .then(() => console.log(`[AppContext] New order sound played: ${soundUrl}`))
                                  .catch(err => {
                                    console.error(`[AppContext] Error playing new order sound (${soundUrl}):`, err);
                                  });
                            } catch (err) {
                                console.error(`[AppContext] Failed to create or play audio for new order (${soundUrl}):`, err);
                            }
                        } else {
                            console.log("[AppContext] New order received, sound alert enabled, but no sound URL configured.");
                        }
                    }
                } 
            } else if (payload.eventType === 'DELETE') { 
                dispatch({ type: 'SET_ORDERS', payload: state.orders.filter(o => o.id !== (payload.old as RawOrder).id )}); 
            } 
        }).subscribe();
        const tablesSubscription = supabase.channel('public:tables').on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => { console.log('Realtime table change:', payload); if (payload.eventType === 'INSERT') dispatch({ type: 'ADD_TABLE_SUCCESS', payload: mapRawTableToTable(payload.new as RawTable) }); else if (payload.eventType === 'UPDATE') dispatch({ type: 'UPDATE_TABLE_SUCCESS', payload: mapRawTableToTable(payload.new as RawTable) }); else if (payload.eventType === 'DELETE') dispatch({ type: 'DELETE_TABLE_SUCCESS', payload: (payload.old as RawTable).id }); }).subscribe();
        const cashSessionsSubscription = supabase.channel('public:cash_register_sessions').on('postgres_changes', { event: '*', schema: 'public', table: 'cash_register_sessions'}, (payload) => { console.log('Realtime cash session change:', payload); const session = mapRawCashRegisterSessionToCashRegisterSession(payload.new as RawCashRegisterSession); if (payload.eventType === 'INSERT') dispatch({ type: 'ADD_CASH_SESSION_SUCCESS', payload: session }); else if (payload.eventType === 'UPDATE') dispatch({ type: 'UPDATE_CASH_SESSION_SUCCESS', payload: session }); }).subscribe();
        
        let cashAdjustmentsSubscription: any = null;
        if (!state.cashAdjustmentsTableMissing) {
            console.log('[AppContext] Subscribing to cash_adjustments changes.');
            cashAdjustmentsSubscription = supabase.channel('public:cash_adjustments').on('postgres_changes', { event: '*', schema: 'public', table: 'cash_adjustments'}, (payload) => { console.log('Realtime cash adjustment change:', payload); if(payload.eventType === 'INSERT') { const newAdj = mapRawCashAdjustmentToCashAdjustment(payload.new as RawCashAdjustment); dispatch({ type: 'ADD_CASH_ADJUSTMENT_SUCCESS', payload: newAdj }); } }).subscribe();
        } else { console.warn("[AppContext] Skipping cash_adjustments realtime subscription (table missing)."); }

        // Add subscription for profiles if needed
        const profilesSubscription = supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles'}, (payload) => {
            console.log('Realtime profile change:', payload);
            if (payload.eventType === 'INSERT') {
                dispatch({ type: 'ADD_PROFILE_SUCCESS', payload: payload.new as Profile });
            } else if (payload.eventType === 'UPDATE') {
                dispatch({ type: 'UPDATE_PROFILE_SUCCESS', payload: payload.new as Profile });
            } else if (payload.eventType === 'DELETE') {
                dispatch({ type: 'DELETE_PROFILE_SUCCESS', payload: (payload.old as Profile).id });
            }
        }).subscribe();


        return () => { 
            console.log('[AppContext] Removing Realtime subscriptions.'); 
            supabase.removeChannel(ordersSubscription); supabase.removeChannel(tablesSubscription); 
            supabase.removeChannel(cashSessionsSubscription); 
            supabase.removeChannel(profilesSubscription); // Remove profiles subscription
            if (cashAdjustmentsSubscription) { supabase.removeChannel(cashAdjustmentsSubscription); }
            if (newOrderAudioRef.current) {
                newOrderAudioRef.current.pause();
                newOrderAudioRef.current.src = '';
                newOrderAudioRef.current = null;
            }
        };
    } else {
        console.log(`[AppContext] Realtime subscriptions SKIPPED: initialDataLoaded=${initialDataLoadedRef.current}, isLoading=${state.isLoading}, cashAdjustmentsTableMissing=${state.cashAdjustmentsTableMissing}`);
    }
  }, [initialDataLoadedRef.current, state.isLoading, state.cashAdjustmentsTableMissing, fetchOrderWithItemsCb, state.orders, state.settings]); 

  useEffect(() => { 
    if (initialDataLoadedRef.current && !state.isLoading && state.settings) { 
        const interval = setInterval(checkOrderTransitions, AUTO_PROGRESS_INTERVAL);
        return () => clearInterval(interval);
    }
  }, [checkOrderTransitions, state.isLoading, state.settings]);

  const contextValue: AppContextProps = {
    ...state, dispatch, addCategory, updateCategory, deleteCategory, addMenuItem, updateMenuItem, deleteMenuItem,
    updateOrderStatus, forceCheckOrderTransitions: checkOrderTransitions, toggleOrderAutoProgress, createManualOrder,
    addItemsToOrder, fetchOrderWithItems: fetchOrderWithItemsCb, addTable, updateTable, deleteTable, 
    addToCart, addRawCartItem, removeFromCart, updateCartQuantity, clearCart, setCustomerDetails: setCustomerDetailsCb, 
    placeOrder, setAlert: setAlertCb, openCashRegister, closeCashRegister, addCashAdjustment, closeTableAccount,
    fetchSettings, updateSettings, 
    // Added missing properties:
    addProfile, updateProfile, deleteProfile, initiateOrderForCustomer,
    signIn, signUp, signOut, signInWithGoogle, requestPasswordReset, updateUserPassword,
    clearDirectOrderProfile, clearPrefilledCustomerForOrder, fetchProfileById,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
