import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, X, Menu as MenuIcon, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import useMenu from '../hooks/useMenu';
import useCart from '../hooks/useCart';
import CategoryTabs from './CategoryTabs';
import MenuGrid from './MenuGrid';
import Cart from './Cart';
import ItemDetailModal from './ItemDetailModal';

const MenuContainer = () => {
  const {
    sessionId,
    tableNumber,
    showCart,
    showItemModal,
    selectedMenuItem,
    isOnline,
    addNotification,
    showCart: openCart,
    hideCart,
    hideItemModal,
    updateActivity
  } = useApp();

  const { cartItemCount } = useCart(sessionId);
  const {
    menuItems,
    loading,
    error,
    selectedCategory,
    searchQuery,
    filterByCategory,
    searchMenu,
    clearFilters,
    refetchMenu,
    isDataStale
  } = useMenu();

  const [showSearch, setShowSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Handle search input changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMenu(localSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, searchMenu]);

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Handle pull-to-refresh
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let pullDistance = 0;
    const threshold = 100;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (startY === 0) return;
      
      currentY = e.touches[0].clientY;
      pullDistance = currentY - startY;
      
      if (pullDistance > 0 && pullDistance < threshold) {
        // Add visual feedback for pull-to-refresh
        document.body.style.transform = `translateY(${pullDistance * 0.5}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > threshold) {
        refetchMenu();
        addNotification({
          type: 'info',
          message: 'Refreshing menu...',
          duration: 2000
        });
      }
      
      // Reset
      document.body.style.transform = '';
      startY = 0;
      pullDistance = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [refetchMenu, addNotification]);

  // Track user activity
  useEffect(() => {
    const handleUserActivity = () => {
      updateActivity();
    };

    const events = ['click', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [updateActivity]);

  const handleSearchToggle = useCallback(() => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setLocalSearchQuery('');
      searchMenu('');
    }
  }, [showSearch, searchMenu]);

  const handleClearFilters = useCallback(() => {
    setLocalSearchQuery('');
    clearFilters();
    setShowSearch(false);
  }, [clearFilters]);

  const handleCategoryChange = useCallback((category) => {
    filterByCategory(category);
    // Clear search when changing categories
    if (searchQuery) {
      setLocalSearchQuery('');
      searchMenu('');
    }
  }, [filterByCategory, searchQuery, searchMenu]);

  if (error) {
    return (
      <div className="min-h-screen bg-background-color">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <MenuIcon className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Unable to Load Menu
            </h2>
            <p className="text-text-secondary mb-6">
              {error}
            </p>
            <button
              onClick={refetchMenu}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-scroll-container bg-background-color">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-surface-color shadow-sm safe-area-top">
        <div className="container mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-color rounded-full flex items-center justify-center">
                <MenuIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">
                  Table {tableNumber}
                </h1>
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-text-secondary">
                    {isOnline ? 'Connected' : 'Offline'}
                  </span>
                  {isDataStale && (
                    <span className="text-xs text-orange-500">
                      • Data may be outdated
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search Button */}
              <button
                onClick={handleSearchToggle}
                className="p-2 rounded-full hover:bg-background-color transition-colors"
                aria-label="Search menu"
              >
                <Search className="w-5 h-5 text-text-secondary" />
              </button>
              
              {/* Cart Button */}
              <button
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-background-color transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5 text-text-secondary" />
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary-color text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </motion.span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 overflow-hidden"
              >
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for dishes, categories..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="form-control pr-10"
                  />
                  {localSearchQuery && (
                    <button
                      onClick={() => setLocalSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-background-color"
                    >
                      <X className="w-4 h-4 text-text-secondary" />
                    </button>
                  )}
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Tabs */}
          <CategoryTabs
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20 menu-content">
        {/* Active Filters */}
        {(searchQuery || selectedCategory !== 'all') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between py-4"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">Active filters:</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-primary-color text-white text-sm rounded-full">
                  "{searchQuery}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="px-2 py-1 bg-secondary-color text-white text-sm rounded-full capitalize">
                  {selectedCategory}
                </span>
              )}
            </div>
            <button
              onClick={handleClearFilters}
              className="text-sm text-primary-color hover:text-primary-dark"
            >
              Clear all
            </button>
          </motion.div>
        )}

        {/* Menu Grid */}
        <MenuGrid
          menuItems={menuItems}
          loading={loading}
          onRefresh={refetchMenu}
        />

        {/* No Results */}
        {!loading && menuItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Search className="w-16 h-16 text-text-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No dishes found
            </h3>
            <p className="text-text-secondary mb-6">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : `No dishes available in ${selectedCategory} category`
              }
            </p>
            <button
              onClick={handleClearFilters}
              className="btn btn-primary"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Cart Overlay */}
      <AnimatePresence>
        {showCart && <Cart onClose={hideCart} />}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedMenuItem}
        isOpen={showItemModal}
        onClose={hideItemModal}
      />
    </div>
  );
};

export default MenuContainer;