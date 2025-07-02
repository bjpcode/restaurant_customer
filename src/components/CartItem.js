import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, Edit3 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import useCart from '../hooks/useCart';

const CartItem = ({ item }) => {
  const { sessionId, addNotification } = useApp();
  const { updateQuantity, removeFromCart, updateSpecialInstructions } = useCart(sessionId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedInstructions, setEditedInstructions] = useState(item.specialInstructions || '');

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity <= 0) {
      handleRemove();
      return;
    }
    updateQuantity(item.cartId, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.cartId);
    addNotification({
      type: 'info',
      message: `${item.name} removed from cart`,
      duration: 2000
    });
  };

  const handleSaveInstructions = () => {
    updateSpecialInstructions(item.cartId, editedInstructions.trim());
    setIsEditing(false);
    
    if (editedInstructions.trim() !== (item.specialInstructions || '')) {
      addNotification({
        type: 'success',
        message: 'Special instructions updated',
        duration: 2000
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedInstructions(item.specialInstructions || '');
    setIsEditing(false);
  };

  const formatPrice = (price) => `$${price.toFixed(2)}`;
  const itemTotal = item.price * item.quantity;

  return (
    <motion.div
      layout
      className="card p-4"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex space-x-3">
        {/* Item Image */}
        <div className="w-16 h-16 flex-shrink-0">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🍽️</span>
            </div>
          )}
          <div 
            className="w-full h-full bg-gray-100 rounded-lg items-center justify-center hidden"
          >
            <span className="text-lg">🍽️</span>
          </div>
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-text-primary leading-tight">
              {item.name}
            </h3>
            <button
              onClick={handleRemove}
              className="p-1 text-text-light hover:text-red-500 transition-colors"
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Price and Category */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-secondary capitalize">
              {item.category}
            </span>
            <div className="text-right">
              <div className="font-bold text-primary-color">
                {formatPrice(itemTotal)}
              </div>
              <div className="text-xs text-text-secondary">
                {formatPrice(item.price)} each
              </div>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-text-primary">Qty:</span>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-border-color flex items-center justify-center hover:bg-background-color transition-colors touch-target"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </motion.button>
                <span className="text-lg font-bold text-text-primary w-8 text-center">
                  {item.quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="w-8 h-8 rounded-full border border-border-color flex items-center justify-center hover:bg-background-color transition-colors touch-target"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </motion.button>
              </div>
            </div>

            {/* Prep Time */}
            {item.preparation_time && (
              <div className="text-xs text-text-secondary">
                ~{item.preparation_time}m
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="mt-3">
            {!isEditing ? (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {item.specialInstructions ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <Edit3 className="w-3 h-3 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700">
                          Special Instructions:
                        </span>
                      </div>
                      <p className="text-sm text-yellow-800">
                        {item.specialInstructions}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-text-light italic">
                      No special instructions
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 p-1 text-text-light hover:text-primary-color transition-colors"
                  aria-label="Edit special instructions"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <textarea
                  rows={2}
                  placeholder="Add special instructions..."
                  value={editedInstructions}
                  onChange={(e) => setEditedInstructions(e.target.value)}
                  className="form-control text-sm resize-none"
                  maxLength={150}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-light">
                    {editedInstructions.length}/150
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-sm px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveInstructions}
                      className="btn btn-sm px-3 py-1 text-xs bg-primary-color text-white hover:bg-primary-dark"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;