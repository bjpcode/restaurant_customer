import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Clock, AlertTriangle, Star, ShoppingCart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import useCart from '../hooks/useCart';

const ItemDetailModal = ({ item, isOpen, onClose }) => {
  const { sessionId, addNotification } = useApp();
  const { addToCart, getItemQuantity } = useCart(sessionId);
  
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const currentCartQuantity = getItemQuantity(item?.id);

  // Reset state when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setSpecialInstructions('');
      setImageLoaded(false);
      setImageError(false);
      setIsAdding(false);
    }
  }, [isOpen, item]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      //document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      //document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleQuantityChange = useCallback((change) => {
    setQuantity(prev => Math.max(1, prev + change));
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!item?.is_available) {
      addNotification({
        type: 'error',
        message: 'This item is currently unavailable',
        duration: 3000
      });
      return;
    }

    setIsAdding(true);

    try {
      addToCart(item, quantity, specialInstructions.trim());
      
      addNotification({
        type: 'success',
        message: `${quantity}x ${item.name} added to cart`,
        duration: 3000
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to add item to cart',
        duration: 3000
      });
    } finally {
      setIsAdding(false);
    }
  }, [item, quantity, specialInstructions, addToCart, addNotification, onClose]);

  const formatPrice = (price) => `$${price.toFixed(2)}`;

  const formatPrepTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getAllergenDisplay = (allergens) => {
    const allergenMap = {
      'gluten': { emoji: '🌾', name: 'Gluten' },
      'dairy': { emoji: '🥛', name: 'Dairy' },
      'eggs': { emoji: '🥚', name: 'Eggs' },
      'nuts': { emoji: '🥜', name: 'Nuts' },
      'shellfish': { emoji: '🦐', name: 'Shellfish' },
      'soy': { emoji: '🫘', name: 'Soy' },
      'fish': { emoji: '🐟', name: 'Fish' }
    };

    return allergens.map(allergen => 
      allergenMap[allergen.toLowerCase()] || { emoji: '⚠️', name: allergen }
    );
  };

  if (!item) return null;

  const totalPrice = item.price * quantity;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg bg-surface-color rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface-color border-b border-border-color z-10">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-bold text-text-primary pr-8">
                  {item.name}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-background-color transition-colors touch-target"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Image */}
              <div className="relative">
                {item.image_url && !imageError ? (
                  <>
                    {!imageLoaded && (
                      <div className="w-full h-64 bg-gray-200 animate-pulse" />
                    )}
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={`
                        w-full h-64 object-cover transition-opacity duration-300
                        ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                      `}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </>
                ) : (
                  <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}

                {/* Status indicators */}
                <div className="absolute top-4 left-4 flex flex-col space-y-2">
                  {!item.is_available && (
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Unavailable</span>
                    </div>
                  )}
                  
                  {Math.random() > 0.8 && (
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Popular</span>
                    </div>
                  )}
                </div>

                <div className="absolute top-4 right-4">
                  <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-lg font-bold">
                    {formatPrice(item.price)}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-6">
                {/* Description */}
                {item.description && (
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Description</h3>
                    <p className="text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  {item.preparation_time && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Prep time: {formatPrepTime(item.preparation_time)}</span>
                    </div>
                  )}
                  
                  <div className="capitalize">
                    Category: {item.category}
                  </div>
                </div>

                {/* Allergens */}
                {item.allergens && item.allergens.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-text-primary mb-3">Allergen Information</h3>
                    <div className="flex flex-wrap gap-2">
                      {getAllergenDisplay(item.allergens).map((allergen, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{allergen.emoji}</span>
                          <span>{allergen.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutritional info */}
                {item.nutritional_info && (
                  <div>
                    <h3 className="font-semibold text-text-primary mb-3">Nutritional Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(item.nutritional_info).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-text-secondary capitalize">
                            {key.replace('_', ' ')}:
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special instructions */}
                <div>
                  <label htmlFor="instructions" className="block font-semibold text-text-primary mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    id="instructions"
                    rows={3}
                    placeholder="Any special requests or modifications..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="form-control resize-none"
                    maxLength={200}
                  />
                  <div className="text-xs text-text-light mt-1">
                    {specialInstructions.length}/200 characters
                  </div>
                </div>

                {/* Current cart quantity */}
                {currentCartQuantity > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-sm">
                        You have {currentCartQuantity} of this item in your cart
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-surface-color border-t border-border-color p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-text-primary">Quantity:</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-full border border-border-color flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background-color transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-bold text-text-primary w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-10 h-10 rounded-full border border-border-color flex items-center justify-center hover:bg-background-color transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-text-secondary">Total</div>
                  <div className="text-xl font-bold text-primary-color">
                    {formatPrice(totalPrice)}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!item.is_available || isAdding}
                className="btn btn-primary w-full btn-lg"
              >
                {isAdding ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner" />
                    <span>Adding to Cart...</span>
                  </div>
                ) : (
                  `Add ${quantity} to Cart • ${formatPrice(totalPrice)}`
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ItemDetailModal;