import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useState, useRef } from 'react';
import { supabase, getArray, handleSupabaseError } from '../services/supabaseClient';
import { 
    Category, MenuItem, Order, OrderStatus, AlertInfo, CartItem, CustomerDetails, 
    OrderItem, ManualOrderData, OrderType, PaymentMethod, Table, TableStatus, ReservationDetails,
    RawCategory, RawMenuItem, RawTable, RawOrder, RawOrderItem, OrderItemFlavorDetails, PizzaSize, PizzaCrust,
    CashRegisterSession, RawCashRegisterSession, CashRegisterSessionStatus, PaymentDetails,
    CashAdjustment, RawCashAdjustment, CashAdjustmentType, // Added CashAdjustment types
    Profile, SupabaseUser 
} from '../types';
import { 
    generateId, 
    ORDER_STATUS_DURATIONS,
    ORDER_PROGRESSION_SEQUENCE, 
    AUTO_PROGRESS_INTERVAL
} from '../constants';


// --- State ---
interface AppState {
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  tables: Table[];
  cart: CartItem[];
  customerDetails: CustomerDetails | null;
  alert: AlertInfo | null;
  isLoading: boolean; 
  authLoading: boolean; 
  activeCashSession: CashRegisterSession | null;
  cashSessions: CashRegisterSession[];
  cashAdjustments: CashAdjustment[]; // New state for cash adjustments
  currentUser: SupabaseUser | null;
  currentProfile: Profile | null;
  cashAdjustmentsTableMissing: boolean; // Flag for missing table
}

const initialState: AppState = {
  categories: [],
  menuItems: [],
  orders: [],
  tables: [],
  cart: [],
  customerDetails: null,
  alert: null,
  isLoading: true, 
  authLoading: true, 
  activeCashSession: null,
  cashSessions: [],
  cashAdjustments: [], // Initialize cash adjustments
  currentUser: null,
  currentProfile: null,
  cashAdjustmentsTableMissing: false, // Initialize flag
};

// --- Actions ---
type Action =
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
  | { type: 'REALTIME_ORDER_UPDATE'; payload: Order }
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'ADD_TABLE_SUCCESS'; payload: Table }
  | { type: 'UPDATE_TABLE_SUCCESS'; payload: Table }
  | { type: 'DELETE_TABLE_SUCCESS'; payload: string }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: CartItem } 
  | { type: 'ADD_RAW_CART_ITEM_SUCCESS'; payload: CartItem } 
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { cartItemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CUSTOMER_DETAILS'; payload: CustomerDetails | null }
  | { type: 'SET_ALERT'; payload: AlertInfo | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_CASH_SESSION'; payload: CashRegisterSession | null }
  | { type: 'SET_CASH_SESSIONS'; payload: CashRegisterSession[] }
  | { type: 'ADD_CASH_SESSION_SUCCESS'; payload: CashRegisterSession }
  | { type: 'UPDATE_CASH_SESSION_SUCCESS'; payload: CashRegisterSession }
  | { type: 'SET_CASH_ADJUSTMENTS'; payload: CashAdjustment[] } // New action
  | { type: 'ADD_CASH_ADJUSTMENT_SUCCESS'; payload: CashAdjustment } // New action
  | { type: 'SET_CURRENT_USER'; payload: SupabaseUser | null }
  | { type: 'SET_CURRENT_PROFILE'; payload: Profile | null }
  | { type: 'SET_CASH_ADJUSTMENTS_TABLE_MISSING'; payload: boolean }; // Action for missing table

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
    case 'REALTIME_ORDER_UPDATE':
        const updatedOrder = action.payload;
        const existingOrderIndex = state.orders.findIndex(o => o.id === updatedOrder.id);
        if (existingOrderIndex > -1) {
            const newOrders = [...state.orders];
            newOrders[existingOrderIndex] = updatedOrder;
            return { ...state, orders: newOrders.sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
        }
        return { ...state, orders: [updatedOrder, ...state.orders].sort((a,b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
    case 'SET_TABLES': return { ...state, tables: action.payload.sort((a,b)=> a.name.localeCompare(b.name)) };
    case 'ADD_TABLE_SUCCESS': return { ...state, tables: [...state.tables, action.payload].sort((a,b)=> a.name.localeCompare(b.name)) };
    case 'UPDATE_TABLE_SUCCESS': return { ...state, tables: state.tables.map(t => t.id === action.payload.id ? action.payload : t).sort((a,b)=> a.name.localeCompare(b.name)) };
    case 'DELETE_TABLE_SUCCESS': return { ...state, tables: state.tables.filter(t => t.id !== action.payload).sort((a,b)=> a.name.localeCompare(b.name)) };
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
  addCashAdjustment: (sessionId: string, type: CashAdjustmentType, amount: number, reason: string) => Promise<CashAdjustment | null>; // New function
  closeTableAccount: (orderId: string, paymentDetails: PaymentDetails) => Promise<Order | null>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<SupabaseUser | null>;
  signIn: (email: string, password: string) => Promise<SupabaseUser | null>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  updateUserProfile: (profileData: Partial<Profile>) => Promise<Profile | null>;
}

// --- Context Creation ---
const AppContext = createContext<AppContextProps | undefined>(undefined);

// --- Provider Component ---
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const initialDataLoadedRef = useRef(false);

  const setAlertCb = useCallback((alertInfo: AlertInfo | null) => {
    dispatch({ type: 'SET_ALERT', payload: alertInfo });
  }, []);

  // --- Data Mapping ---
  const mapRawCategoryToCategory = (raw: RawCategory): Category => ({ ...raw });
  const mapRawMenuItemToMenuItem = (raw: RawMenuItem): MenuItem => ({ ...raw, send_to_kitchen: raw.send_to_kitchen ?? true, sizes: raw.sizes || undefined, allow_half_and_half: raw.allow_half_and_half || undefined });
  const mapRawTableToTable = (raw: RawTable): Table => ({ ...raw });
  const mapRawOrderToOrder = (raw: RawOrder, items: OrderItem[] = []): Order => ({ ...raw, items, customer_id: raw.customer_id || null });
  const mapRawOrderItemToOrderItem = (raw: RawOrderItem): OrderItem => ({ 
    ...raw, 
    first_half_flavor: raw.first_half_flavor || undefined,
    second_half_flavor: raw.second_half_flavor || undefined
  });
  const mapRawCashRegisterSessionToCashRegisterSession = (raw: RawCashRegisterSession): CashRegisterSession => ({ ...raw });
  const mapRawCashAdjustmentToCashAdjustment = (raw: RawCashAdjustment): CashAdjustment => ({ ...raw }); // New mapper

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
        if (error) { handleSupabaseError({ error, customMessage: "Falha ao excluir item" }); return; }
        dispatch({ type: 'DELETE_MENU_ITEM_SUCCESS', payload: id });
        setAlertCb({ message: 'Item excluído!', type: 'success' });
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); }
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
    let updates: Partial<Order> = { status, last_status_change_time: new Date().toISOString() };
    if (manual) {
        if (status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED || (orderToUpdate.order_type === OrderType.MESA && status === OrderStatus.READY_FOR_PICKUP)) {
            updates.auto_progress = false; updates.next_auto_transition_time = null; updates.current_progress_percent = 100;
            if(orderToUpdate.order_type === OrderType.MESA && status === OrderStatus.READY_FOR_PICKUP) setAlertCb({ message: `Pedido da Mesa ${state.tables.find(t => t.id === orderToUpdate.table_id)?.name || orderToUpdate.table_id} pronto! Aguardando fechamento.`, type: 'info' });
        } else {
            const duration = ORDER_STATUS_DURATIONS[status];
            updates.auto_progress = duration > 0;
            updates.next_auto_transition_time = duration > 0 ? new Date(Date.now() + duration).toISOString() : null;
            updates.current_progress_percent = 0;
            if (duration === 0) { updates.current_progress_percent = 100; } // auto_progress already false
        }
    } else { // Automatic transition
         updates.current_progress_percent = 0; 
         const duration = ORDER_STATUS_DURATIONS[status];
         updates.next_auto_transition_time = duration > 0 ? new Date(Date.now() + duration).toISOString() : null;
         updates.auto_progress = duration > 0; // Key for continued auto-progression
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
        const updatedOrder = await fetchOrderWithItemsCb(id);
        if (updatedOrder) dispatch({ type: 'UPDATE_ORDER_STATUS_SUCCESS', payload: updatedOrder });
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); }
  }, [state.orders, state.tables, setAlertCb, fetchOrderWithItemsCb]);
  
  const checkOrderTransitions = useCallback(async () => {
    for (const order of state.orders) {
        if (order.auto_progress && order.next_auto_transition_time && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
            const now = Date.now(); const nextTransitionTime = new Date(order.next_auto_transition_time).getTime();
            const totalDuration = ORDER_STATUS_DURATIONS[order.status]; const timeElapsed = totalDuration - (nextTransitionTime - now);
            let currentProgress = totalDuration > 0 ? Math.min(100, Math.max(0, (timeElapsed / totalDuration) * 100)) : (nextTransitionTime <= now ? 100 : 0);
            if (now >= nextTransitionTime) {
                const nextStatus = ORDER_PROGRESSION_SEQUENCE[order.status];
                if (nextStatus) {
                    if (order.order_type === OrderType.MESA && nextStatus === OrderStatus.READY_FOR_PICKUP) {
                        console.log(`[AppContext] checkOrderTransitions: Auto-advancing MESA order ${order.id} to READY_FOR_PICKUP.`);
                        await updateOrderStatus(order.id, OrderStatus.READY_FOR_PICKUP, false);
                    } else if (nextStatus === OrderStatus.OUT_FOR_DELIVERY && order.order_type !== OrderType.DELIVERY) {
                        console.log(`[AppContext] checkOrderTransitions: Auto-advancing NON-DELIVERY order ${order.id} from READY to DELIVERED.`);
                        await updateOrderStatus(order.id, OrderStatus.DELIVERED, false);
                    } else {
                        console.log(`[AppContext] checkOrderTransitions: Auto-advancing order ${order.id} to ${nextStatus}.`);
                        await updateOrderStatus(order.id, nextStatus, false);
                    }
                } else {
                    console.log(`[AppContext] checkOrderTransitions: No next status for order ${order.id}, disabling auto-progress.`);
                    await supabase.from('orders').update({ auto_progress: false, current_progress_percent: 100 }).eq('id', order.id);
                    const updatedOrderData = await fetchOrderWithItemsCb(order.id); if (updatedOrderData) dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: updatedOrderData });
                }
            } else {
                const currentDBProgress = order.current_progress_percent || 0;
                if (Math.abs(currentProgress - currentDBProgress) > 5 || (currentProgress === 100 && currentDBProgress !== 100) || (currentProgress === 0 && currentDBProgress !== 0) ) {
                    console.log(`[AppContext] checkOrderTransitions: Updating progress_percent for order ${order.id} in DB to ${Math.round(currentProgress)}.`);
                    const { error: progressError } = await supabase.from('orders').update({ current_progress_percent: Math.round(currentProgress) }).eq('id', order.id);
                    if (!progressError) { dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: { ...order, current_progress_percent: Math.round(currentProgress) } }); }
                } else if (currentProgress !== order.current_progress_percent) { 
                    dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: { ...order, current_progress_percent: Math.round(currentProgress) } });
                }
            }
        }
    }
  }, [state.orders, updateOrderStatus, fetchOrderWithItemsCb]);

  const toggleOrderAutoProgress = useCallback(async (orderId: string) => {
    const order = state.orders.find(o => o.id === orderId); if (!order) return;
    if (!order.auto_progress && order.order_type === OrderType.MESA && order.status === OrderStatus.READY_FOR_PICKUP) {
        setAlertCb({ message: "Este pedido de mesa aguarda fechamento manual.", type: 'info' });
        if(order.auto_progress !== false) { await supabase.from('orders').update({ auto_progress: false, next_auto_transition_time: null, current_progress_percent: 100 }).eq('id', orderId); const updatedOrder = await fetchOrderWithItemsCb(orderId); if (updatedOrder) dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: updatedOrder });} return;
    }
    
    const newAutoProgressState = !order.auto_progress;
    let updates: Partial<Order> = { auto_progress: newAutoProgressState };

    if (newAutoProgressState) { // Enabling
        updates.last_status_change_time = new Date().toISOString();
        const duration = ORDER_STATUS_DURATIONS[order.status];
        if (duration > 0) {
            updates.next_auto_transition_time = new Date(Date.now() + duration).toISOString();
            updates.current_progress_percent = 0;
        } else { // Cannot enable auto-progress for a status with no duration
            updates.auto_progress = false; // Revert
            updates.next_auto_transition_time = null;
            updates.current_progress_percent = 100;
            setAlertCb({ message: `Progresso automático não pode ser ativado para o status atual "${order.status}".`, type: 'info' });
        }
    } else { // Disabling
        updates.next_auto_transition_time = null;
        // current_progress_percent is not changed here, it will just stop.
    }

    try {
        const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
        if (error) { handleSupabaseError({ error, customMessage: "Falha ao alternar progresso." }); }
        else { const updatedOrder = await fetchOrderWithItemsCb(orderId); if (updatedOrder) dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: updatedOrder }); }
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); }
  }, [state.orders, setAlertCb, fetchOrderWithItemsCb]);

  const createManualOrder = useCallback(async (orderData: ManualOrderData): Promise<Order | null> => {
    let customerNameForOrder = orderData.customerName;
    if (orderData.orderType === OrderType.MESA && !orderData.customerName.trim()) {
        const tableName = state.tables.find(t => t.id === orderData.tableId)?.name || orderData.tableId;
        customerNameForOrder = `Mesa ${tableName || 'Desconhecida'}`;
    }
    const orderItemsToInsert: Omit<RawOrderItem, 'id' | 'order_id' | 'created_at'>[] = orderData.items.map(item => ({ menu_item_id: item.menuItemId, quantity: item.quantity, name: item.name, price: item.price, selected_size_id: item.selectedSize?.id, selected_crust_id: item.selectedCrust?.id, is_half_and_half: item.isHalfAndHalf, first_half_flavor: item.firstHalfFlavor, second_half_flavor: item.secondHalfFlavor }));
    const totalAmount = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let activeSessionId: string | null = null;
    if (orderData.orderType !== OrderType.MESA && (orderData.paymentMethod === PaymentMethod.DINHEIRO || orderData.paymentMethod === PaymentMethod.PIX)) {
        if (state.activeCashSession) activeSessionId = state.activeCashSession.id;
        else setAlertCb({message: "Nenhum caixa aberto para registrar pagamento. Pedido criado sem vínculo a sessão.", type: "info"});
    }

    const initialStatus = OrderStatus.PENDING;
    const initialDuration = ORDER_STATUS_DURATIONS[initialStatus];
    const nowTime = Date.now();

    const newRawOrder: Omit<RawOrder, 'id' | 'created_at' | 'order_time' | 'last_status_change_time'> = { 
        customer_name: customerNameForOrder, 
        customer_phone: orderData.customerPhone, 
        customer_address: orderData.customerAddress, 
        total_amount: totalAmount, 
        status: initialStatus, 
        notes: orderData.notes, 
        order_type: orderData.orderType, 
        table_id: orderData.tableId, 
        payment_method: orderData.orderType !== OrderType.MESA ? orderData.paymentMethod : null, 
        amount_paid: orderData.orderType !== OrderType.MESA && orderData.paymentMethod === PaymentMethod.DINHEIRO ? orderData.amountPaid : null, 
        change_due: orderData.orderType !== OrderType.MESA && orderData.paymentMethod === PaymentMethod.DINHEIRO && orderData.amountPaid && orderData.amountPaid >= totalAmount ? orderData.amountPaid - totalAmount : null, 
        auto_progress: initialDuration > 0, 
        current_progress_percent: 0, 
        next_auto_transition_time: initialDuration > 0 ? new Date(nowTime + initialDuration).toISOString() : null,
        cash_register_session_id: activeSessionId, 
        customer_id: null 
    };
    try {
        // Supabase will use DEFAULT now() for order_time and last_status_change_time if not provided
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
        if (finalOrder) { setAlertCb({message: `Pedido para ${customerNameForOrder} criado!`, type: "success"}); dispatch({ type: 'ADD_ORDER_SUCCESS', payload: finalOrder }); return finalOrder; } return null;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [state.tables, state.activeCashSession, setAlertCb, fetchOrderWithItemsCb, updateTable]);

  const addItemsToOrder = useCallback(async (orderId: string, newCartItems: CartItem[]): Promise<Order | null> => {
    if (newCartItems.length === 0) {
      setAlertCb({ message: "Nenhum item para adicionar.", type: "info" });
      return null;
    }
    try {
      const { data: existingOrderData, error: fetchError } = await supabase
        .from('orders')
        .select('total_amount, status') // Fetch current status
        .eq('id', orderId)
        .single();

      if (fetchError || !existingOrderData) {
        handleSupabaseError({ error: fetchError, customMessage: "Falha ao buscar pedido existente." });
        return null;
      }
      
      if (existingOrderData.status === OrderStatus.DELIVERED || existingOrderData.status === OrderStatus.CANCELLED) {
        setAlertCb({ message: `Não é possível adicionar itens a um pedido que já está ${existingOrderData.status}.`, type: "error" });
        return null;
      }

      const orderItemsToInsert: Omit<RawOrderItem, 'id' | 'created_at'>[] = newCartItems.map(item => ({
        order_id: orderId,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        selected_size_id: item.selectedSize?.id,
        selected_crust_id: item.selectedCrust?.id,
        is_half_and_half: item.isHalfAndHalf,
        first_half_flavor: item.firstHalfFlavor,
        second_half_flavor: item.secondHalfFlavor,
      }));

      const { error: itemsInsertError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsInsertError) {
        handleSupabaseError({ error: itemsInsertError, customMessage: "Falha ao adicionar novos itens ao pedido." });
        return null;
      }

      const newItemsTotal = newCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const updatedTotalAmount = existingOrderData.total_amount + newItemsTotal;

      const orderUpdates: Partial<RawOrder> = {
        total_amount: updatedTotalAmount,
        last_status_change_time: new Date().toISOString(),
      };
      
      // If items are added to an 'Em Preparo' order, revert it to 'Pendente'
      // to ensure it re-enters the kitchen queue correctly with the new items.
      // If it's 'Pendente', just reset its timer.
      if (existingOrderData.status === OrderStatus.PREPARING) {
        orderUpdates.status = OrderStatus.PENDING;
        const newStatusDuration = ORDER_STATUS_DURATIONS[OrderStatus.PENDING];
        orderUpdates.auto_progress = newStatusDuration > 0;
        orderUpdates.next_auto_transition_time = newStatusDuration > 0 ? new Date(Date.now() + newStatusDuration).toISOString() : null;
        orderUpdates.current_progress_percent = 0;
      } else if (existingOrderData.status === OrderStatus.PENDING) {
        const currentStatusDuration = ORDER_STATUS_DURATIONS[OrderStatus.PENDING];
        orderUpdates.auto_progress = currentStatusDuration > 0; // Ensure it's true if duration exists
        orderUpdates.next_auto_transition_time = currentStatusDuration > 0 ? new Date(Date.now() + currentStatusDuration).toISOString() : null;
        orderUpdates.current_progress_percent = 0; // Reset progress for the PENDING stage
      }
      // For other statuses, no automatic change to status or auto-progression.

      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update(orderUpdates)
        .eq('id', orderId);

      if (orderUpdateError) {
        handleSupabaseError({ error: orderUpdateError, customMessage: "Falha ao atualizar o pedido." });
        return null;
      }

      const updatedOrder = await fetchOrderWithItemsCb(orderId);
      if (updatedOrder) {
        dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: updatedOrder });
        setAlertCb({ message: `${newCartItems.length} item(ns) adicionado(s) à comanda! O pedido foi atualizado.`, type: 'success' });
        return updatedOrder;
      }
      return null;

    } catch (e) {
      setAlertCb({ message: (e as Error).message, type: 'error' });
      return null;
    }
  }, [setAlertCb, fetchOrderWithItemsCb]);


  const addToCart = useCallback((item: MenuItem, quantity: number = 1) => {
    if (!item.available) { setAlertCb({ message: `${item.name} está indisponível.`, type: 'info' }); return; }
    const cartItem: CartItem = { id: generateId(), menuItemId: item.id, name: item.name, price: item.price, quantity: quantity, imageUrl: item.image_url, itemType: item.item_type };
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  }, [setAlertCb]);
  const addRawCartItem = useCallback((item: CartItem) => dispatch({ type: 'ADD_RAW_CART_ITEM_SUCCESS', payload: item }), []);
  const removeFromCart = useCallback((cartItemId: string) => dispatch({ type: 'REMOVE_FROM_CART', payload: cartItemId }), []);
  const updateCartQuantity = useCallback((cartItemId: string, quantity: number) => dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { cartItemId, quantity } }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const setCustomerDetailsCb = useCallback((details: CustomerDetails | null) => dispatch({ type: 'SET_CUSTOMER_DETAILS', payload: details }), []);

  // --- User Profile Functions (Moved before placeOrder) ---
  const fetchUserProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) { console.warn(`Perfil não encontrado ou erro: ${userId}`, error.message); return null; }
        return data as Profile;
    } catch (e) { console.error("Exceção ao buscar perfil:", e); setAlertCb({ message: `Erro ao buscar perfil: ${(e as Error).message}`, type: "error" }); return null; }
  }, [setAlertCb]);

  const updateUserProfile = useCallback(async (profileData: Partial<Profile>): Promise<Profile | null> => {
    if (!state.currentUser?.id) { setAlertCb({message: "Usuário não autenticado.", type: "error"}); return null; }
    try {
        const { data, error } = await supabase.from('profiles').update(profileData).eq('id', state.currentUser.id).select().single();
        if (error || !data) { handleSupabaseError({error, customMessage: "Falha ao atualizar perfil."}); return null; }
        const updatedProfile = data as Profile;
        dispatch({ type: 'SET_CURRENT_PROFILE', payload: updatedProfile}); return updatedProfile;
    } catch(e) { setAlertCb({ message: (e as Error).message, type: "error" }); return null; }
  }, [state.currentUser, setAlertCb]);


  const placeOrder = useCallback(async (): Promise<Order | null> => {
     if (state.cart.length === 0) { setAlertCb({ message: 'Carrinho vazio.', type: 'info' }); return null; }
     if (!state.customerDetails?.name || !state.customerDetails?.phone || !state.customerDetails?.address) { setAlertCb({ message: 'Detalhes do cliente são obrigatórios.', type: 'error' }); return null; }
     const orderItems: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[] = state.cart.map(ci => ({ menu_item_id: ci.menuItemId, quantity: ci.quantity, name: ci.name, price: ci.price, selected_size_id: ci.selectedSize?.id, selected_crust_id: ci.selectedCrust?.id, is_half_and_half: ci.isHalfAndHalf, first_half_flavor: ci.firstHalfFlavor, second_half_flavor: ci.secondHalfFlavor }));
     const totalAmount = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
     if (state.currentUser && state.currentProfile && state.customerDetails) {
        const profileUpdates: Partial<Profile> = {};
        if (state.customerDetails.name !== state.currentProfile.full_name) profileUpdates.full_name = state.customerDetails.name;
        if (state.customerDetails.phone !== state.currentProfile.phone) profileUpdates.phone = state.customerDetails.phone;
        if (state.customerDetails.address !== state.currentProfile.default_address) profileUpdates.default_address = state.customerDetails.address;
        if (state.customerDetails.addressReference !== state.currentProfile.default_address_reference) profileUpdates.default_address_reference = state.customerDetails.addressReference;
        if (Object.keys(profileUpdates).length > 0) {
            try { await updateUserProfile(profileUpdates); } // updateUserProfile is now defined
            catch (profileError) { console.error("Error updating profile during order:", profileError); }
        }
     }

    const initialStatus = OrderStatus.PENDING;
    const initialDuration = ORDER_STATUS_DURATIONS[initialStatus];
    const nowTime = Date.now();

    const orderPayload: Omit<RawOrder, 'id' | 'created_at' | 'order_time' | 'last_status_change_time'> = { 
        customer_name: state.customerDetails.name, 
        customer_phone: state.customerDetails.phone, 
        customer_address: state.customerDetails.address, 
        customer_id: state.currentUser?.id || null, 
        total_amount: totalAmount, 
        status: initialStatus, 
        notes: state.customerDetails.notes, 
        auto_progress: initialDuration > 0, 
        current_progress_percent: 0, 
        next_auto_transition_time: initialDuration > 0 ? new Date(nowTime + initialDuration).toISOString() : null,
        order_type: OrderType.DELIVERY 
    };
     try {
        // Supabase will use DEFAULT now() for order_time and last_status_change_time if not provided
        const { data: newOrderData, error: orderError } = await supabase.from('orders').insert(orderPayload).select().single();
        if (orderError || !newOrderData) { handleSupabaseError({ error: orderError, customMessage: 'Falha ao criar pedido' }); return null; }
        const orderItemsWithOrderId = orderItems.map(item => ({ ...item, order_id: newOrderData.id }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItemsWithOrderId);
        if (itemsError) { await supabase.from('orders').delete().eq('id', newOrderData.id); handleSupabaseError({ error: itemsError, customMessage: 'Falha ao salvar itens. Pedido revertido.' }); return null; }
        const finalOrder = await fetchOrderWithItemsCb(newOrderData.id);
        if (finalOrder) { dispatch({ type: 'ADD_ORDER_SUCCESS', payload: finalOrder }); setAlertCb({ message: `Pedido #${finalOrder.id.substring(0,6)} realizado!`, type: 'success' }); clearCart(); return finalOrder; } return null;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: 'error' }); return null; }
  }, [state.cart, state.customerDetails, state.currentUser, state.currentProfile, setAlertCb, clearCart, fetchOrderWithItemsCb, updateUserProfile]);

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
        const payload = { 
            closed_at: new Date().toISOString(), 
            status: CashRegisterSessionStatus.CLOSED, 
            closing_balance_informed: closingBalanceInformed, 
            notes_closing: notes, 
            calculated_sales: calculatedSalesFromOrders, // This remains only order sales
            expected_in_cash: expectedInCash, 
            difference: difference 
        };
        const { data, error } = await supabase.from('cash_register_sessions').update(payload).eq('id', sessionId).select().single();
        if (error || !data) { handleSupabaseError({error, customMessage: "Falha ao fechar caixa."}); return null; }
        const closedSession = mapRawCashRegisterSessionToCashRegisterSession(data as RawCashRegisterSession);
        dispatch({ type: 'UPDATE_CASH_SESSION_SUCCESS', payload: closedSession});
        setAlertCb({message: `Caixa fechado. Diferença: R$ ${difference.toFixed(2)}`, type: difference === 0 ? "success" : "info"}); return closedSession;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: "error" }); return null; }
  }, [state.cashSessions, state.orders, state.cashAdjustments, setAlertCb]);

  const addCashAdjustment = useCallback(async (sessionId: string, type: CashAdjustmentType, amount: number, reason: string): Promise<CashAdjustment | null> => {
    if (state.cashAdjustmentsTableMissing) {
      setAlertCb({ message: "A funcionalidade de ajuste de caixa está indisponível. Tabela 'cash_adjustments' não encontrada.", type: "error" });
      return null;
    }
    if (amount <= 0) {
        setAlertCb({ message: "O valor do ajuste deve ser positivo.", type: "error" });
        return null;
    }
    try {
        const payload: Omit<RawCashAdjustment, 'id' | 'created_at'> = {
            session_id: sessionId,
            type,
            amount,
            reason,
            adjusted_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from('cash_adjustments').insert(payload).select().single();
        if (error || !data) {
            handleSupabaseError({ error, customMessage: "Falha ao adicionar ajuste ao caixa." });
            return null;
        }
        const newAdjustment = mapRawCashAdjustmentToCashAdjustment(data as RawCashAdjustment);
        dispatch({ type: 'ADD_CASH_ADJUSTMENT_SUCCESS', payload: newAdjustment });
        setAlertCb({ message: `Ajuste de ${type === CashAdjustmentType.ADD ? 'entrada' : 'saída'} de R$ ${amount.toFixed(2)} registrado!`, type: "success" });
        return newAdjustment;
    } catch (e) {
        setAlertCb({ message: (e as Error).message, type: "error" });
        return null;
    }
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
        if(finalOrder) dispatch({ type: 'UPDATE_ORDER_STATUS_SUCCESS', payload: finalOrder });
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

  const signUp = useCallback(async (email: string, password: string, fullName: string, phone?: string): Promise<SupabaseUser | null> => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError || !authData.user) { handleSupabaseError({ error: authError, customMessage: "Falha no cadastro" }); return null; }
        const profilePayload: Omit<Profile, 'id' | 'created_at' | 'updated_at'> = { full_name: fullName, phone: phone || null };
        const { error: profileError } = await supabase.from('profiles').insert({ id: authData.user.id, ...profilePayload });
        if (profileError) {
            console.warn("Attempting to delete auth user due to profile creation failure for user ID:", authData.user.id);
            handleSupabaseError({ error: profileError, customMessage: "Falha ao criar perfil." }); return null;
        }
        setAlertCb({ message: "Cadastro realizado! Verifique seu email para confirmação (se habilitado).", type: "success" });
        return authData.user;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: "error" }); return null; }
    finally { dispatch({ type: 'SET_AUTH_LOADING', payload: false }); }
  }, [setAlertCb]);

  const signIn = useCallback(async (email: string, password: string): Promise<SupabaseUser | null> => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) { handleSupabaseError({ error, customMessage: "Falha no login" }); return null; }
        setAlertCb({ message: "Login realizado!", type: "success" }); return data.user;
    } catch (e) { setAlertCb({ message: (e as Error).message, type: "error" }); return null; }
    finally { dispatch({ type: 'SET_AUTH_LOADING', payload: false }); }
  }, [setAlertCb]);

  const signOut = useCallback(async () => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
        const { error } = await supabase.auth.signOut();
        if (error) { handleSupabaseError({ error, customMessage: "Falha ao sair" }); }
        else { dispatch({ type: 'SET_CURRENT_USER', payload: null }); dispatch({ type: 'SET_CURRENT_PROFILE', payload: null }); setAlertCb({ message: "Você saiu.", type: "info" }); }
    } catch (e) { setAlertCb({ message: (e as Error).message, type: "error" }); }
    finally { dispatch({ type: 'SET_AUTH_LOADING', payload: false }); }
  }, [setAlertCb]);

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
            handleSupabaseError({ error, customMessage: "Falha ao enviar email de redefinição de senha." });
            return false;
        }
        setAlertCb({ message: "Email de redefinição de senha enviado! Verifique sua caixa de entrada.", type: "success" });
        return true;
    } catch (e) {
        handleSupabaseError({ error: e as Error, customMessage: "Erro ao enviar email de redefinição de senha." });
        return false;
    } finally {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, [setAlertCb]);


  // --- Effects ---
  const fetchInitialAdminData = useCallback(async () => {
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
        
        // Fetch cash adjustments separately to handle missing table error
        const cashAdjRes = await supabase.from('cash_adjustments').select('*').order('adjusted_at', { ascending: false });
        if (cashAdjRes.error) {
            if (cashAdjRes.error.message.includes('relation "public.cash_adjustments" does not exist')) {
                console.warn("[AppContext] Warning: Table 'cash_adjustments' not found. Cash adjustment feature will be limited.");
                setAlertCb({ 
                    message: "Atenção: A funcionalidade de ajustes manuais de caixa está indisponível pois a tabela 'cash_adjustments' não foi encontrada no banco de dados. Verifique a configuração ou contate o suporte.", 
                    type: 'info' 
                });
                dispatch({ type: 'SET_CASH_ADJUSTMENTS', payload: [] });
                dispatch({ type: 'SET_CASH_ADJUSTMENTS_TABLE_MISSING', payload: true });
                cashAdjustmentsTableIsMissing = true; // Set flag
            } else {
                handleSupabaseError({error: cashAdjRes.error, customMessage: "Falha ao carregar ajustes de caixa"});
            }
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
    } catch (e) { 
        // The message from `handleSupabaseError` should be user-friendly enough
        setAlertCb({ message: (e as Error).message, type: 'error' });
        console.error("[AppContext] Critical error during admin data fetch, but trying to continue:", e);
    } 
    return cashAdjustmentsTableIsMissing; // Return the flag
  }, [setAlertCb, fetchOrderWithItemsCb]);
  
  const fetchInitialCustomerData = useCallback(async () => {
    try {
        const [catRes, itemRes] = await Promise.all([
            supabase.from('categories').select('*').order('name'),
            supabase.from('menu_items').select('*').eq('available', true).order('name')
        ]);
        if (catRes.error) handleSupabaseError({error: catRes.error, customMessage: "Falha ao carregar categorias"}); else dispatch({ type: 'SET_CATEGORIES', payload: getArray(catRes.data).map(mapRawCategoryToCategory) });
        if (itemRes.error) handleSupabaseError({error: itemRes.error, customMessage: "Falha ao carregar itens do cardápio"}); else dispatch({ type: 'SET_MENU_ITEMS', payload: getArray(itemRes.data).map(mapRawMenuItemToMenuItem) });
    } catch (e) { 
      setAlertCb({ message: (e as Error).message, type: 'error' }); 
      throw e; 
    }
  }, [setAlertCb]);

  useEffect(() => { 
    console.log('[AppContext] Auth listener useEffect setup.');
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AppContext] onAuthStateChange event: ${event}`, session);
      const user = session?.user ?? null;
      dispatch({ type: 'SET_CURRENT_USER', payload: user });
      if (user) { const profile = await fetchUserProfile(user.id); dispatch({ type: 'SET_CURRENT_PROFILE', payload: profile }); }
      else { dispatch({ type: 'SET_CURRENT_PROFILE', payload: null }); }
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      console.log('[AppContext] Auth state changed, SET_AUTH_LOADING to false.');
    });
    
    (async () => { 
      console.log('[AppContext] Initial session check running.');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AppContext] Initial session check result:', session);
      const user = session?.user ?? null;
      dispatch({ type: 'SET_CURRENT_USER', payload: user });
      if (user) { const profile = await fetchUserProfile(user.id); dispatch({ type: 'SET_CURRENT_PROFILE', payload: profile }); }
      else { dispatch({ type: 'SET_CURRENT_PROFILE', payload: null }); }
      
      if (initialState.authLoading || state.authLoading) { 
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
        console.log('[AppContext] Initial session check complete, SET_AUTH_LOADING to false.');
      }
    })();
    return () => { authListener?.subscription.unsubscribe(); };
  }, [fetchUserProfile]);


  useEffect(() => { 
    let adjustmentsTableMissingInThisLoad = false;
    const loadData = async () => {
      if (state.authLoading || initialDataLoadedRef.current) {
        console.log(`[AppContext] Initial Data Loader SKIPPED (pre-conditions): authLoading=${state.authLoading}, initialDataLoadedRef=${initialDataLoadedRef.current}`);
        return;
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('[AppContext] Initial Data Loader STARTING...');

      const params = new URLSearchParams(window.location.search);
      const customerViewActive = params.get('view') === 'customer';
      console.log(`[AppContext] Initial Data Loader: customerViewActive (from URL)=${customerViewActive}`);

      try {
        if (customerViewActive) {
          console.log('[AppContext] Fetching initial CUSTOMER data.');
          await fetchInitialCustomerData();
        } else {
          console.log('[AppContext] Fetching initial ADMIN data.');
          adjustmentsTableMissingInThisLoad = await fetchInitialAdminData(); // Capture the flag
        }
        initialDataLoadedRef.current = true;
        console.log('[AppContext] Initial Data Loader FINISHED SUCCESSFULLY. initialDataLoadedRef set to true.');
      } catch (error) {
          console.error('[AppContext] CRITICAL ERROR during initial data load:', error);
          // The error message should already be set by handleSupabaseError through setAlertCb in fetchInitialAdminData/fetchInitialCustomerData
          // So, no need to set another generic alert here unless state.alert is null.
          if (!state.alert) { 
               setAlertCb({ message: `Erro crítico ao carregar dados iniciais: ${(error as Error).message}`, type: 'error' });
          }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('[AppContext] Initial Data Loader: SET_LOADING to false in finally block.');
      }
    };
    loadData();
  }, [state.authLoading, fetchInitialAdminData, fetchInitialCustomerData, state.alert, setAlertCb]);


  useEffect(() => { 
    if (initialDataLoadedRef.current && !state.isLoading && !state.authLoading) {
        console.log('[AppContext] Setting up Realtime subscriptions.');
        const ordersSubscription = supabase.channel('public:orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => { console.log('Realtime order change:', payload); if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') { const changedOrder = await fetchOrderWithItemsCb((payload.new as RawOrder).id); if (changedOrder) dispatch({ type: 'REALTIME_ORDER_UPDATE', payload: changedOrder }); } else if (payload.eventType === 'DELETE') { dispatch({ type: 'SET_ORDERS', payload: state.orders.filter(o => o.id !== (payload.old as RawOrder).id )}); } }).subscribe();
        const tablesSubscription = supabase.channel('public:tables').on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => { console.log('Realtime table change:', payload); if (payload.eventType === 'INSERT') dispatch({ type: 'ADD_TABLE_SUCCESS', payload: mapRawTableToTable(payload.new as RawTable) }); else if (payload.eventType === 'UPDATE') dispatch({ type: 'UPDATE_TABLE_SUCCESS', payload: mapRawTableToTable(payload.new as RawTable) }); else if (payload.eventType === 'DELETE') dispatch({ type: 'DELETE_TABLE_SUCCESS', payload: (payload.old as RawTable).id }); }).subscribe();
        const cashSessionsSubscription = supabase.channel('public:cash_register_sessions').on('postgres_changes', { event: '*', schema: 'public', table: 'cash_register_sessions'}, (payload) => { console.log('Realtime cash session change:', payload); const session = mapRawCashRegisterSessionToCashRegisterSession(payload.new as RawCashRegisterSession); if (payload.eventType === 'INSERT') dispatch({ type: 'ADD_CASH_SESSION_SUCCESS', payload: session }); else if (payload.eventType === 'UPDATE') dispatch({ type: 'UPDATE_CASH_SESSION_SUCCESS', payload: session }); }).subscribe();
        
        let cashAdjustmentsSubscription: any = null;
        if (!state.cashAdjustmentsTableMissing) {
            console.log('[AppContext] Subscribing to cash_adjustments changes.');
            cashAdjustmentsSubscription = supabase.channel('public:cash_adjustments').on('postgres_changes', { event: '*', schema: 'public', table: 'cash_adjustments'}, (payload) => { console.log('Realtime cash adjustment change:', payload); if(payload.eventType === 'INSERT') { const newAdj = mapRawCashAdjustmentToCashAdjustment(payload.new as RawCashAdjustment); dispatch({ type: 'ADD_CASH_ADJUSTMENT_SUCCESS', payload: newAdj }); } /* TODO: Handle UPDATE/DELETE if needed */ }).subscribe();
        } else {
            console.warn("[AppContext] Skipping cash_adjustments realtime subscription as table was reported missing.");
        }

        return () => { 
            console.log('[AppContext] Removing Realtime subscriptions.'); 
            supabase.removeChannel(ordersSubscription); 
            supabase.removeChannel(tablesSubscription); 
            supabase.removeChannel(cashSessionsSubscription); 
            if (cashAdjustmentsSubscription) {
                supabase.removeChannel(cashAdjustmentsSubscription);
            }
        };
    } else {
        console.log(`[AppContext] Realtime subscriptions SKIPPED: initialDataLoaded=${initialDataLoadedRef.current}, isLoading=${state.isLoading}, authLoading=${state.authLoading}, cashAdjustmentsTableMissing=${state.cashAdjustmentsTableMissing}`);
    }
  }, [initialDataLoadedRef.current, state.isLoading, state.authLoading, state.cashAdjustmentsTableMissing, fetchOrderWithItemsCb, state.orders]); 

  useEffect(() => { 
    if (initialDataLoadedRef.current && !state.isLoading) {
        const interval = setInterval(checkOrderTransitions, AUTO_PROGRESS_INTERVAL);
        return () => clearInterval(interval);
    }
  }, [checkOrderTransitions, state.isLoading]);

  const contextValue: AppContextProps = {
    ...state, dispatch, addCategory, updateCategory, deleteCategory, addMenuItem, updateMenuItem, deleteMenuItem,
    updateOrderStatus, forceCheckOrderTransitions: checkOrderTransitions, toggleOrderAutoProgress, createManualOrder,
    addItemsToOrder, 
    fetchOrderWithItems: fetchOrderWithItemsCb, addTable, updateTable, deleteTable, addToCart, addRawCartItem,
    removeFromCart, updateCartQuantity, clearCart, setCustomerDetails: setCustomerDetailsCb, placeOrder,
    setAlert: setAlertCb, openCashRegister, closeCashRegister, addCashAdjustment, // Added addCashAdjustment
    closeTableAccount,
    signUp, signIn, signOut, requestPasswordReset, updateUserProfile,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// --- Custom Hook ---
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
