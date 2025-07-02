import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  ShoppingCart,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import useOrders from '../hooks/useOrders';
import useCart from '../hooks/useCart';
import LoadingStates from './LoadingStates';

const OrderHistory = () => {
  const { sessionId, addNotification } = useApp();
  const { 
    orders, 
    loading, 
    formatOrder, 
    canReorder, 
    prepareReorderData, 
    getEstimatedDeliveryTime,
    ORDER_STATUS_COLORS 
  } = useOrders(sessionId);
  const { addToCart, clearCart } = useCart(sessionId);
  
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [reorderingOrder, setReorderingOrder] = useState(null);

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleReorder = async (order) => {
    if (!canReorder(order)) {
      addNotification({
        type: 'error',
        message: 'This order cannot be reordered',
        duration: 3000
      });
      return;
    }

    setReorderingOrder(order.id);

    try {
      const reorderData = prepareReorderData(order);
      if (!reorderData) {
        throw new Error('Unable to prepare reorder data');
      }

      // Clear current cart and add reorder items
      clearCart();
      
      // Add each item to cart
      for (const item of reorderData.order_items) {
        // We need to simulate the full menu item object
        const menuItem = {
          id: item.menu_item_id,
          name: item.name,
          price: item.price,
          category: 'reorder', // placeholder
          preparation_time: 15 // placeholder
        };
        
        addToCart(menuItem, item.quantity, item.special_instructions);
      }

      addNotification({
        type: 'success',
        message: `${reorderData.order_items.length} items added to cart from previous order`,
        duration: 4000
      });
    } catch (error) {
      console.error('Error reordering:', error);
      addNotification({
        type: 'error',
        message: 'Failed to reorder items',
        duration: 3000
      });
    } finally {
      setReorderingOrder(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'preparing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Order History</h2>
        <LoadingStates.Orders />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Order History</h2>
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-text-light mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No orders yet
          </h3>
          <p className="text-text-secondary">
            Your order history will appear here once you place your first order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Order History</h2>
      
      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order, index) => {
            const formattedOrder = formatOrder(order);
            const isExpanded = expandedOrders.has(order.id);
            const estimatedDelivery = getEstimatedDeliveryTime(order);
            const isReordering = reorderingOrder === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden"
              >
                {/* Order Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-background-color transition-colors"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-full"
                        style={{ backgroundColor: `${ORDER_STATUS_COLORS[order.status]}20` }}
                      >
                        <div style={{ color: ORDER_STATUS_COLORS[order.status] }}>
                          {getStatusIcon(order.status)}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-text-secondary">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateTime(order.created_at)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{formattedOrder.formattedAmount}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div 
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${ORDER_STATUS_COLORS[order.status]}20`,
                            color: ORDER_STATUS_COLORS[order.status]
                          }}
                        >
                          {formattedOrder.statusLabel}
                        </div>
                        {estimatedDelivery && estimatedDelivery.remainingMinutes > 0 && (
                          <div className="text-xs text-text-secondary mt-1">
                            ~{estimatedDelivery.remainingMinutes}m remaining
                          </div>
                        )}
                      </div>
                      
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-text-secondary" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-border-color"
                    >
                      <div className="p-4 space-y-4">
                        {/* Order Items */}
                        <div>
                          <h4 className="font-medium text-text-primary mb-3">Items Ordered</h4>
                          <div className="space-y-2">
                            {order.order_items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-border-color last:border-b-0">
                                <div className="flex-1">
                                  <h5 className="font-medium text-text-primary">{item.name}</h5>
                                  {item.special_instructions && (
                                    <p className="text-sm text-text-secondary italic">
                                      Note: {item.special_instructions}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    {item.quantity}× ${item.price.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-text-secondary">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Special Instructions */}
                        {order.special_instructions && (
                          <div>
                            <h4 className="font-medium text-text-primary mb-2">Special Instructions</h4>
                            <p className="text-sm text-text-secondary bg-background-color p-3 rounded-lg">
                              {order.special_instructions}
                            </p>
                          </div>
                        )}

                        {/* Order Timeline */}
                        <div>
                          <h4 className="font-medium text-text-primary mb-3">Order Timeline</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-text-secondary">
                                Order placed at {new Date(order.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            {order.updated_at !== order.created_at && (
                              <div className="flex items-center space-x-3 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-text-secondary">
                                  Last updated at {new Date(order.updated_at).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-4">
                          <div className="text-sm text-text-secondary">
                            Table {order.table_number} • {formattedOrder.totalItems} items
                          </div>
                          
                          {canReorder(order) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReorder(order);
                              }}
                              disabled={isReordering}
                              className="btn btn-sm btn-secondary"
                            >
                              {isReordering ? (
                                <div className="flex items-center space-x-2">
                                  <LoadingStates.Spinner size="sm" />
                                  <span>Adding to Cart...</span>
                                </div>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Reorder
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderHistory;