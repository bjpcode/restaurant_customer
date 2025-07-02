import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const subscribeToMenuUpdates = (callback) => {
  return supabase
    .channel('menu-updates')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'menu_rest'  // ← CHANGED FROM 'menu'
      }, 
      callback
    )
    .subscribe();
};

export const subscribeToOrderUpdates = (sessionId, callback) => {
  return supabase
    .channel(`order-updates-${sessionId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `session_id=eq.${sessionId}`
      }, 
      callback
    )
    .subscribe();
};

export const fetchMenu = async () => {
  try {
    const { data, error } = await supabase
      .from('menu_rest')  // ← CHANGED FROM 'menu'
      .select('*')
      .eq('is_available', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }
};

export const submitOrder = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting order:', error);
    throw error;
  }
};

export const getOrdersBySession = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const checkAvailability = async (menuItemIds) => {
  try {
    const { data, error } = await supabase
      .from('menu_rest')  // ← CHANGED FROM 'menu'
      .select('id, is_available')
      .in('id', menuItemIds);

    if (error) throw error;
    
    const unavailableItems = data.filter(item => !item.is_available);
    return {
      allAvailable: unavailableItems.length === 0,
      unavailableItems: unavailableItems.map(item => item.id)
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};