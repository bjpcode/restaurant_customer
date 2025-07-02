import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import useCart from '../hooks/useCart';
import useOrders from '../hooks/useOrders';
import CartItem from './CartItem';
import CartSummary from './CartSummary';

const Cart = ({ onClose }) => {
  const { 
    sessionId, 
    tableNumber, 
    addNotification, 
    isOnline 
  } = useApp();
  
  const {
    cart,
    cartTotal,
    cartItemCount,
    estimatedPrepTime,
    clearCart,
    validateCart,
    prepareOrderData
  } = useCart(sessionId);

  const { submitNewOrder, submittingOrder } = useOrders(sessionId);

  const [orderStep, setOrderStep] = useState('cart'); // cart, review, submitting, success
  const [orderData, setOrderData] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [validationError, setValidationError] = useState(null);

  // Handle escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Auto-close success screen after delay
  useEffect(() => {
    if (orderStep === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [orderStep, onClose]);

  const handleProceedToReview = useCallback(async () => {
    if (cart.length === 0) {
      addNotification({
        type: 'error',
        message: 'Your cart is empty',
        duration: 3000
      });
      return;
    }

    if (!isOnline) {
      addNotification({
        type: 'error',
        message: 'You need an internet connection to place an order',
        duration: 5000
      });
      return;
    }

    setValidationError(null);

    try {
      // Validate cart items are still available
      const validation = await validateCart(async (itemIds) => {
        // Mock validation - in real app this would call the API
        return { allAvailable: true, unavailableItems: [] };
      });

      if (!validation.valid) {
        if (validation.unavailableItems?.length > 0) {
          addNotification({
            type: 'warning',
            message: `${validation.unavailableItems.length} items were removed from your cart as they're no longer available`,
            duration: 5000
          });
        } else if (validation.error) {
          setValidationError(validation.error);
          return;
        }
      }

      // Prepare order data
      const data = prepareOrderData(
        tableNumber,
        sessionId,
        { special_instructions: specialInstructions.trim() }
      );

      setOrderData(data);
      setOrderStep('review');
    } catch (error) {
      console.error('Error validating cart:', error);
      setValidationError('Failed to validate cart items');
    }
  }, [cart, isOnline, validateCart, prepareOrderData, tableNumber, sessionId, specialInstructions, addNotification]);

  const handleSubmitOrder = useCallback(async () => {
    if (!orderData) return;

    setOrderStep('submitting');

    try {
      const newOrder = await submitNewOrder(orderData);
      
      addNotification({
        type: 'success',
        message: `Order #${newOrder.id.slice(-8)} placed successfully!`,
        duration: 5000
      });

      // Clear cart after successful order
      clearCart();
      setOrderStep('success');
    } catch (error) {
      console.error('Error submitting order:', error);
      setOrderStep('review');
      
      addNotification({
        type: 'error',
        message: error.message || 'Failed to place order. Please try again.',
        duration: 5000
      });
    }
  }, [orderData, submitNewOrder, clearCart, addNotification]);

  const handleBackToCart = useCallback(() => {
    setOrderStep('cart');
    setOrderData(null);
    setValidationError(null);
  }, []);

  const renderCartContent = () => {
    if (cart.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-text-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Your cart is empty
            </h3>
            <p className="text-text-secondary mb-6">
              Add some delicious items to get started!
            </p>
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              Browse Menu
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {cart.map((item, index) => (
              <motion.div
                key={item.cartId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ delay: index * 0.1 }}
              >
                <CartItem item={item} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Special Instructions */}
          <div className="pt-4 border-t border-border-color">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Special Instructions for the Kitchen
            </label>
            <textarea
              rows={3}
              placeholder="Any special requests, allergies, or modifications..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="form-control resize-none"
              maxLength={300}
            />
            <div className="text-xs text-text-light mt-1">
              {specialInstructions.length}/300 characters
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{validationError}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="border-t border-border-color bg-surface-color">
          <CartSummary
            subtotal={cartTotal}
            total={cartTotal}
            estimatedTime={estimatedPrepTime}
            itemCount={cartItemCount}
          />
          
          <div className="p-4">
            <button
              onClick={handleProceedToReview}
              disabled={cart.length === 0 || !isOnline}
              className="btn btn-primary w-full btn-lg"
            >
              Review Order
            </button>
            
            {!isOnline && (
              <p className="text-xs text-red-500 text-center mt-2">
                Internet connection required to place order
              </p>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderReviewContent = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Review Your Order
          </h3>
          <p className="text-text-secondary">
            Please review your order before placing it
          </p>
        </div>

        {/* Order Items */}
        <div className="space-y-3">
          {orderData?.order_items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-border-color">
              <div className="flex-1">
                <h4 className="font-medium text-text-primary">{item.name}</h4>
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

        {/* Special Instructions */}
        {orderData?.special_instructions && (
          <div className="bg-background-color rounded-lg p-3">
            <h4 className="font-medium text-text-primary mb-1">
              Special Instructions
            </h4>
            <p className="text-sm text-text-secondary">
              {orderData.special_instructions}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border-color bg-surface-color">
        <CartSummary
          subtotal={orderData?.total_amount || 0}
          total={orderData?.total_amount || 0}
          estimatedTime={orderData?.estimated_prep_time}
          itemCount={orderData?.order_items.reduce((sum, item) => sum + item.quantity, 0)}
          tableNumber={tableNumber}
        />
        
        <div className="p-4 space-y-3">
          <button
            onClick={handleSubmitOrder}
            disabled={submittingOrder}
            className="btn btn-primary w-full btn-lg"
          >
            {submittingOrder ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Placing Order...</span>
              </div>
            ) : (
              `Place Order • $${orderData?.total_amount.toFixed(2)}`
            )}
          </button>
          
          <button
            onClick={handleBackToCart}
            disabled={submittingOrder}
            className="btn btn-secondary w-full"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </>
  );

  const renderSubmittingContent = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-6"
        >
          <Loader2 className="w-16 h-16 text-primary-color mx-auto" />
        </motion.div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Placing Your Order
        </h3>
        <p className="text-text-secondary">
          Please wait while we process your order...
        </p>
      </div>
    </div>
  );

  const renderSuccessContent = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        </motion.div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Order Placed Successfully!
        </h3>
        <p className="text-text-secondary mb-4">
          Your order has been sent to the kitchen. You'll receive updates on the status.
        </p>
        <div className="text-sm text-text-secondary">
          Closing automatically...
        </div>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (orderStep) {
      case 'cart':
        return renderCartContent();
      case 'review':
        return renderReviewContent();
      case 'submitting':
        return renderSubmittingContent();
      case 'success':
        return renderSuccessContent();
      default:
        return renderCartContent();
    }
  };

  const getTitle = () => {
    switch (orderStep) {
      case 'cart':
        return `Cart (${cartItemCount})`;
      case 'review':
        return 'Review Order';
      case 'submitting':
        return 'Placing Order';
      case 'success':
        return 'Order Confirmed';
      default:
        return 'Cart';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* Cart Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="ml-auto w-full max-w-md bg-surface-color flex flex-col h-full safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color bg-surface-color">
          <h2 className="text-lg font-bold text-text-primary">
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-background-color transition-colors touch-target"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        {getStepContent()}
      </motion.div>
    </motion.div>
  );
};

export default Cart;