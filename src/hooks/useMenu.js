import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchMenu, subscribeToMenuUpdates } from '../services/supabase';
import { menuCache } from '../services/api';

const CATEGORIES = ['all', 'meat', 'vegetable', 'sauces', 'desserts', 'drinks'];

const useMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastFetch, setLastFetch] = useState(null);

  // Fetch menu data
  const fetchMenuData = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (useCache) {
        const cachedMenu = menuCache.get('menu');
        if (cachedMenu) {
          setMenuItems(cachedMenu);
          setLoading(false);
          return cachedMenu;
        }
      }

      const data = await fetchMenu();
      setMenuItems(data);
      setLastFetch(Date.now());
      
      // Cache the data
      menuCache.set('menu', data);
      
      return data;
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError(err.message || 'Failed to load menu');
      
      // Try to use cached data as fallback
      const cachedMenu = menuCache.get('menu');
      if (cachedMenu) {
        setMenuItems(cachedMenu);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch menu data (force refresh)
  const refetchMenu = useCallback(() => {
    return fetchMenuData(false);
  }, [fetchMenuData]);

  // Filter menu items by category
  const filteredByCategory = useMemo(() => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  // Search menu items
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByCategory;
    }

    const query = searchQuery.toLowerCase().trim();
    return filteredByCategory.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [filteredByCategory, searchQuery]);

  // Group menu items by category
  const menuItemsByCategory = useMemo(() => {
    const grouped = filteredMenuItems.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    // Sort categories by predefined order
    const sortedGrouped = {};
    CATEGORIES.forEach(category => {
      if (category !== 'all' && grouped[category]) {
        sortedGrouped[category] = grouped[category];
      }
    });

    return sortedGrouped;
  }, [filteredMenuItems]);

  // Get available categories (categories that have items)
  const availableCategories = useMemo(() => {
    const categories = new Set(menuItems.map(item => item.category));
    return CATEGORIES.filter(category => 
      category === 'all' || categories.has(category)
    );
  }, [menuItems]);

  // Get category item counts
  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length };
    
    menuItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    return counts;
  }, [menuItems]);

  // Find menu item by ID
  const getMenuItem = useCallback((id) => {
    return menuItems.find(item => item.id === id);
  }, [menuItems]);

  // Check if items are available
  const checkItemsAvailability = useCallback((itemIds) => {
    const unavailableItems = itemIds.filter(id => {
      const item = getMenuItem(id);
      return !item || !item.is_available;
    });

    return {
      allAvailable: unavailableItems.length === 0,
      unavailableItems
    };
  }, [getMenuItem]);

  // Search functionality
  const searchMenu = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Category filtering
  const filterByCategory = useCallback((category) => {
    if (CATEGORIES.includes(category)) {
      setSelectedCategory(category);
    }
  }, []);

  // Clear search and filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
  }, []);

  // Get popular items (mock implementation - in real app, this would come from analytics)
  const popularItems = useMemo(() => {
    return menuItems
      .filter(item => item.is_available)
      .sort(() => Math.random() - 0.5) // Random for demo
      .slice(0, 6);
  }, [menuItems]);

  // Get featured items (items with images)
  const featuredItems = useMemo(() => {
    return menuItems.filter(item => item.is_available && item.image_url);
  }, [menuItems]);

  // Initialize menu data on mount
  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Set up real-time subscriptions
  useEffect(() => {
    const subscription = subscribeToMenuUpdates((payload) => {
      console.log('Menu update received:', payload);
      
      // Handle different types of changes
      switch (payload.eventType) {
        case 'INSERT':
          setMenuItems(prev => [...prev, payload.new]);
          break;
        case 'UPDATE':
          setMenuItems(prev => 
            prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            )
          );
          break;
        case 'DELETE':
          setMenuItems(prev => 
            prev.filter(item => item.id !== payload.old.id)
          );
          break;
        default:
          // Refetch on unknown changes
          refetchMenu();
      }
      
      // Clear cache on updates
      menuCache.clear();
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [refetchMenu]);

  return {
    // Data
    menuItems: filteredMenuItems,
    allMenuItems: menuItems,
    menuItemsByCategory,
    availableCategories,
    categoryCounts,
    popularItems,
    featuredItems,
    
    // State
    loading,
    error,
    selectedCategory,
    searchQuery,
    lastFetch,
    
    // Actions
    refetchMenu,
    searchMenu,
    filterByCategory,
    clearFilters,
    getMenuItem,
    checkItemsAvailability,
    
    // Utilities
    isDataStale: lastFetch && (Date.now() - lastFetch > 300000), // 5 minutes
    isEmpty: !loading && menuItems.length === 0,
    hasResults: filteredMenuItems.length > 0
  };
};

export default useMenu;