import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import MenuItem from './MenuItem';
import LoadingStates from './LoadingStates';
import { useApp } from '../contexts/AppContext';

const ITEM_HEIGHT = 120; // Height of each menu item
const ITEMS_PER_ROW = 1; // Mobile-first: 1 item per row

const MenuGrid = ({ menuItems = [], loading, onRefresh }) => {
  const { isMobile } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef(null);

  // Group items by category for better organization
  const groupedItems = useMemo(() => {
    const groups = {};
    const categoryOrder = ['meat', 'vegetable', 'sauces', 'desserts', 'drinks'];
    
    menuItems.forEach(item => {
      const category = item.category || 'other';
      if (!groups[category]) {
        groups[category] = {
          title: category.charAt(0).toUpperCase() + category.slice(1),
          items: []
        };
      }
      groups[category].items.push(item);
    });

    // Sort categories and return as array
    const sortedGroups = [];
    categoryOrder.forEach(category => {
      if (groups[category]) {
        sortedGroups.push({ category, ...groups[category] });
      }
    });
    
    // Add any remaining categories
    Object.keys(groups).forEach(category => {
      if (!categoryOrder.includes(category)) {
        sortedGroups.push({ category, ...groups[category] });
      }
    });

    return sortedGroups;
  }, [menuItems]);

  // Flatten items for virtual scrolling with category headers
  const flattenedItems = useMemo(() => {
    const flattened = [];
    
    groupedItems.forEach(group => {
      // Add category header
      flattened.push({
        type: 'header',
        category: group.category,
        title: group.title,
        id: `header-${group.category}`
      });
      
      // Add menu items
      group.items.forEach(item => {
        flattened.push({
          type: 'item',
          ...item
        });
      });
    });
    
    return flattened;
  }, [groupedItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Update visible range for performance optimization
  const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }) => {
    setVisibleRange({ start: visibleStartIndex, end: visibleStopIndex });
  }, []);

  // Row renderer for virtual scrolling
  const renderRow = useCallback(({ index, style }) => {
    const item = flattenedItems[index];
    
    if (!item) return null;

    if (item.type === 'header') {
      return (
        <div style={style}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="sticky top-0 z-10 bg-background-color py-4 px-4"
          >
            <h2 className="text-xl font-bold text-text-primary border-b border-border-color pb-2">
              {item.title}
            </h2>
          </motion.div>
        </div>
      );
    }

    return (
      <div style={style}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="px-4 py-2"
        >
          <MenuItem item={item} />
        </motion.div>
      </div>
    );
  }, [flattenedItems]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingStates.MenuGrid />
      </div>
    );
  }

  // Empty state
  if (!loading && menuItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          No menu items available
        </h3>
        <p className="text-text-secondary mb-6">
          Pull down to refresh or try again later
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-primary"
        >
          {refreshing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Menu
            </>
          )}
        </button>
      </div>
    );
  }

  // For mobile, use simple scrolling instead of virtualization for better performance
  if (isMobile && flattenedItems.length < 50) {
    return (
      <div className="space-y-2">
        <AnimatePresence>
          {flattenedItems.map((item, index) => {
            if (item.type === 'header') {
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="sticky top-0 z-10 bg-background-color py-4 px-4"
                >
                  <h2 className="text-xl font-bold text-text-primary border-b border-border-color pb-2">
                    {item.title}
                  </h2>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="px-4 py-2"
              >
                <MenuItem item={item} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  // Virtual scrolling for large lists
  return (
    <div ref={containerRef} className="h-screen">
      <List
        height={window.innerHeight - 200} // Account for header and padding
        itemCount={flattenedItems.length}
        itemSize={ITEM_HEIGHT}
        onItemsRendered={handleItemsRendered}
        overscanCount={5}
      >
        {renderRow}
      </List>
    </div>
  );
};

export default MenuGrid;