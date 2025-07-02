import { useState, useCallback, useEffect, useMemo } from 'react';
import { submitOrder, getOrdersBySession } from '../services/supabase';
import { subscribeToOrderUpdates } from '../services/supabase';

const ORDER_STATUS_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const ORDER_STATUS_COLORS = {
  pending: '#ffc107',
  confirmed: '#17a2b8',
  preparing: '#fd7e14',
  ready: '#28a745',
  delivered: '#6c757d',
  cancelled: '#dc3545'
};

const useOrders = (sessionId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Fetch orders for current session
  const fetchOrders = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getOrdersBySession(sessionId);
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Submit new order
  const submitNewOrder = useCallback(async (orderData) => {
    try {
      setSubmittingOrder(true);
      setError(null);

      const newOrder = await submitOrder({
        ...orderData,
        session_id: sessionId,
        created_at: new Date().toISOString()
      });

      // Add the new order to the state
      setOrders(prev => [newOrder, ...prev]);
      
      return newOrder;
    } catch (err) {
      console.error('Error submitting order:', err);
      setError(err.message || 'Failed to submit order');
      throw err;
    } finally {
      setSubmittingOrder(false);
    }
  }, [sessionId]);

  // Get order by ID
  const getOrder = useCallback((orderId) => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  // Get orders by status
  const getOrdersByStatus = useCallback((status) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  // Calculate order statistics
  const orderStats = useMemo(() => {
    const stats = {
      total: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.total_amount, 0),
      statusCounts: {},
      averageOrderValue: 0,
      recentOrders: orders.slice(0, 5)
    };

    // Count orders by status
    Object.keys(ORDER_STATUS_LABELS).forEach(status => {
      stats.statusCounts[status] = orders.filter(order => order.status === status).length;
    });

    // Calculate average order value
    if (orders.length > 0) {
      stats.averageOrderValue = stats.totalAmount / orders.length;
    }

    return stats;
  }, [orders]);

  // Get active orders (not delivered or cancelled)
  const activeOrders = useMemo(() => {
    return orders.filter(order => 
      !['delivered', 'cancelled'].includes(order.status)
    );
  }, [orders]);

  // Get completed orders
  const completedOrders = useMemo(() => {
    return orders.filter(order => 
      order.status === 'delivered'
    );
  }, [orders]);

  // Get current order (latest active order)
  const currentOrder = useMemo(() => {
    return activeOrders.length > 0 ? activeOrders[0] : null;
  }, [activeOrders]);

  // Format order for display
  const formatOrder = useCallback((order) => {
    return {
      ...order,
      statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
      statusColor: ORDER_STATUS_COLORS[order.status] || '#6c757d',
      formattedAmount: `$${order.total_amount.toFixed(2)}`,
      formattedDate: new Date(order.created_at).toLocaleDateString(),
      formattedTime: new Date(order.created_at).toLocaleTimeString(),
      itemCount: order.order_items?.length || 0,
      totalItems: order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    };
  }, []);

  // Check if order can be reordered
  const canReorder = useCallback((order) => {
    return order && order.order_items && order.order_items.length > 0;
  }, []);

  // Prepare reorder data
  const prepareReorderData = useCallback((order) => {
    if (!canReorder(order)) return null;

    return {
      table_number: order.table_number,
      order_items: order.order_items.map(item => ({
        ...item,
        special_instructions: item.special_instructions || ''
      })),
      total_amount: order.total_amount,
      special_instructions: `Reorder of order #${order.id.slice(-8)}`
    };
  }, [canReorder]);

  // Calculate estimated delivery time for active orders
  const getEstimatedDeliveryTime = useCallback((order) => {
    if (!order || ['delivered', 'cancelled'].includes(order.status)) {
      return null;
    }

    const orderTime = new Date(order.created_at);
    const prepTime = order.estimated_prep_time || 30; // minutes
    const estimatedDelivery = new Date(orderTime.getTime() + prepTime * 60000);

    return {
      estimatedTime: estimatedDelivery,
      remainingMinutes: Math.max(0, Math.ceil((estimatedDelivery - new Date()) / 60000)),
      isOverdue: estimatedDelivery < new Date()
    };
  }, []);

  // Initialize orders on mount
  useEffect(() => {
    if (sessionId) {
      fetchOrders();
    }
  }, [fetchOrders, sessionId]);

  // Set up real-time subscriptions for order updates
  useEffect(() => {
    if (!sessionId) return;

    const subscription = subscribeToOrderUpdates(sessionId, (payload) => {
      console.log('Order update received:', payload);

      switch (payload.eventType) {
        case 'INSERT':
          setOrders(prev => {
            // Avoid duplicates
            const exists = prev.some(order => order.id === payload.new.id);
            if (!exists) {
              return [payload.new, ...prev];
            }
            return prev;
          });
          break;
        case 'UPDATE':
          setOrders(prev =>
            prev.map(order =>
              order.id === payload.new.id ? payload.new : order
            )
          );
          break;
        case 'DELETE':
          setOrders(prev =>
            prev.filter(order => order.id !== payload.old.id)
          );
          break;
        default:
          // Refetch on unknown changes
          fetchOrders();
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [sessionId, fetchOrders]);

  return {
    // Data
    orders,
    activeOrders,
    completedOrders,
    currentOrder,
    orderStats,

    // State
    loading,
    error,
    submittingOrder,

    // Actions
    submitNewOrder,
    fetchOrders,
    getOrder,
    getOrdersByStatus,

    // Utilities
    formatOrder,
    canReorder,
    prepareReorderData,
    getEstimatedDeliveryTime,

    // Constants
    ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS,

    // Computed
    hasOrders: orders.length > 0,
    hasActiveOrders: activeOrders.length > 0,
    isEmpty: !loading && orders.length === 0
  };
};

export default useOrders;