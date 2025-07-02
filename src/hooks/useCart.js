import { useState, useEffect, useCallback, useMemo } from 'react';

const CART_STORAGE_KEY = 'restaurant_cart';

const useCart = (sessionId) => {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(`${CART_STORAGE_KEY}_${sessionId}`);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, [sessionId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(`${CART_STORAGE_KEY}_${sessionId}`, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart, sessionId]);

  // Add item to cart
  const addToCart = useCallback((menuItem, quantity = 1, specialInstructions = '') => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.id === menuItem.id && item.specialInstructions === specialInstructions
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Add new item
        return [...prevCart, {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          category: menuItem.category,
          image_url: menuItem.image_url,
          preparation_time: menuItem.preparation_time,
          quantity,
          specialInstructions,
          cartId: `${menuItem.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }];
      }
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((cartId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.cartId === cartId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((cartId) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  }, []);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Update special instructions for cart item
  const updateSpecialInstructions = useCallback((cartId, instructions) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartId === cartId
          ? { ...item, specialInstructions: instructions }
          : item
      )
    );
  }, []);

  // Get item from cart by cartId
  const getCartItem = useCallback((cartId) => {
    return cart.find(item => item.cartId === cartId);
  }, [cart]);

  // Check if item is in cart
  const isInCart = useCallback((menuItemId) => {
    return cart.some(item => item.id === menuItemId);
  }, [cart]);

  // Get total quantity for a specific menu item
  const getItemQuantity = useCallback((menuItemId) => {
    return cart
      .filter(item => item.id === menuItemId)
      .reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Calculated values with memoization
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cartTotal; // Same as total for now, but can be different if we add taxes/fees
  }, [cartTotal]);

  const estimatedPrepTime = useMemo(() => {
    if (cart.length === 0) return 0;
    
    // Calculate max prep time (items can be prepared in parallel)
    const maxPrepTime = Math.max(...cart.map(item => item.preparation_time || 15));
    
    // Add buffer time based on cart size
    const bufferTime = Math.min(cart.length * 2, 10);
    
    return maxPrepTime + bufferTime;
  }, [cart]);

  // Group cart items by category for display
  const cartItemsByCategory = useMemo(() => {
    const grouped = cart.reduce((acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    return grouped;
  }, [cart]);

  // Validate cart items (check if all items are still available)
  const validateCart = useCallback(async (checkAvailabilityFn) => {
    if (cart.length === 0) return { valid: true, unavailableItems: [] };

    try {
      setIsLoading(true);
      const menuItemIds = [...new Set(cart.map(item => item.id))];
      const availability = await checkAvailabilityFn(menuItemIds);
      
      if (!availability.allAvailable) {
        const unavailableItems = cart.filter(item => 
          availability.unavailableItems.includes(item.id)
        );
        
        // Remove unavailable items from cart
        setCart(prevCart => 
          prevCart.filter(item => !availability.unavailableItems.includes(item.id))
        );
        
        return { valid: false, unavailableItems };
      }
      
      return { valid: true, unavailableItems: [] };
    } catch (error) {
      console.error('Error validating cart:', error);
      return { valid: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [cart]);

  // Prepare order data for submission
  const prepareOrderData = useCallback((tableNumber, sessionId, additionalData = {}) => {
    return {
      table_number: tableNumber,
      session_id: sessionId,
      order_items: cart.map(item => ({
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        special_instructions: item.specialInstructions || ''
      })),
      total_amount: cartTotal,
      estimated_prep_time: estimatedPrepTime,
      status: 'pending',
      ...additionalData
    };
  }, [cart, cartTotal, estimatedPrepTime]);

  return {
    // State
    cart,
    isLoading,
    
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    updateSpecialInstructions,
    
    // Getters
    getCartItem,
    isInCart,
    getItemQuantity,
    
    // Calculated values
    cartTotal,
    cartItemCount,
    cartSubtotal,
    estimatedPrepTime,
    cartItemsByCategory,
    
    // Utilities
    validateCart,
    prepareOrderData
  };
};

export default useCart;