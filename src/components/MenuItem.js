import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, AlertTriangle, Star } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import useCart from '../hooks/useCart';

const MenuItem = ({ item }) => {
  const { sessionId, showItemModal, addNotification } = useApp();
  const { addToCart, getItemQuantity } = useCart(sessionId);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const currentQuantity = getItemQuantity(item.id);

  const handleQuickAdd = useCallback(async (e) => {
    e.stopPropagation();
    
    if (!item.is_available) {
      addNotification({
        type: 'error',
        message: 'This item is currently unavailable',
        duration: 3000
      });
      return;
    }

    setIsAdding(true);
    
    try {
      addToCart(item, 1);
      addNotification({
        type: 'success',
        message: `${item.name} added to cart`,
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to add item to cart',
        duration: 3000
      });
    } finally {
      setIsAdding(false);
    }
  }, [item, addToCart, addNotification]);

  const handleItemClick = useCallback(() => {
    showItemModal(item);
  }, [item, showItemModal]);

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const formatPrepTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getAllergenEmoji = (allergen) => {
    const allergenMap = {
      'gluten': '🌾',
      'dairy': '🥛',
      'eggs': '🥚',
      'nuts': '🥜',
      'shellfish': '🦐',
      'soy': '🫘',
      'fish': '🐟'
    };
    return allergenMap[allergen.toLowerCase()] || '⚠️';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleItemClick}
      className={`
        card cursor-pointer transition-all duration-200 relative overflow-hidden
        ${!item.is_available ? 'opacity-60' : 'hover:shadow-md'}
      `}
    >
      <div className="flex p-4 space-x-4">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0">
          {item.image_url && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse" />
              )}
              <img
                src={item.image_url}
                alt={item.name}
                className={`
                  w-full h-full object-cover rounded-lg transition-opacity duration-300
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
          
          {/* Unavailable overlay */}
          {!item.is_available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-text-primary text-lg leading-tight">
              {item.name}
            </h3>
            <div className="flex flex-col items-end ml-2">
              <span className="font-bold text-primary-color text-lg">
                {formatPrice(item.price)}
              </span>
              {currentQuantity > 0 && (
                <span className="text-xs text-text-secondary mt-1">
                  {currentQuantity} in cart
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-text-secondary text-sm line-clamp-2 mb-3">
              {item.description}
            </p>
          )}

          {/* Meta information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-text-secondary">
              {/* Prep time */}
              {item.preparation_time && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatPrepTime(item.preparation_time)}</span>
                </div>
              )}

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="flex items-center space-x-1">
                  {item.allergens.slice(0, 3).map((allergen, index) => (
                    <span key={index} className="text-xs" title={allergen}>
                      {getAllergenEmoji(allergen)}
                    </span>
                  ))}
                  {item.allergens.length > 3 && (
                    <span className="text-xs text-text-light">
                      +{item.allergens.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick add button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleQuickAdd}
              disabled={!item.is_available || isAdding}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-200 touch-target
                ${item.is_available
                  ? 'bg-primary-color text-white hover:bg-primary-dark shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label={`Add ${item.name} to cart`}
            >
              {isAdding ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Special indicators */}
      <div className="absolute top-2 left-2 flex flex-col space-y-1">
        {/* Popular item indicator (mock - in real app this would come from analytics) */}
        {Math.random() > 0.8 && (
          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
            <Star className="w-3 h-3" />
            <span>Popular</span>
          </div>
        )}
        
        {/* New item indicator */}
        {new Date(item.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            New
          </div>
        )}
      </div>

      {/* Unavailable overlay */}
      {!item.is_available && (
        <div className="absolute top-2 right-2">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Unavailable
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MenuItem;