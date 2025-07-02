import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState = {
  // Session data
  sessionId: null,
  tableNumber: null,
  isSessionActive: false,

  // UI state
  isMobile: false,
  isOnline: navigator.onLine,
  currentView: 'menu', // menu, cart, orders, profile
  
  // Modal states
  showCart: false,
  showItemModal: false,
  selectedMenuItem: null,
  
  // Toast notifications
  notifications: [],
  
  // App settings
  theme: 'light',
  language: 'en',
  
  // Performance
  isLoading: false,
  lastActivity: Date.now()
};

// Action types
const actionTypes = {
  // Session actions
  SET_SESSION: 'SET_SESSION',
  SET_TABLE_NUMBER: 'SET_TABLE_NUMBER',
  CLEAR_SESSION: 'CLEAR_SESSION',
  
  // UI actions
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_MOBILE: 'SET_MOBILE',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  
  // Modal actions
  SHOW_CART: 'SHOW_CART',
  HIDE_CART: 'HIDE_CART',
  SHOW_ITEM_MODAL: 'SHOW_ITEM_MODAL',
  HIDE_ITEM_MODAL: 'HIDE_ITEM_MODAL',
  
  // Notification actions
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  
  // Settings actions
  SET_THEME: 'SET_THEME',
  SET_LANGUAGE: 'SET_LANGUAGE',
  
  // Performance actions
  SET_LOADING: 'SET_LOADING',
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_SESSION:
      return {
        ...state,
        sessionId: action.payload.sessionId,
        tableNumber: action.payload.tableNumber,
        isSessionActive: true
      };
      
    case actionTypes.SET_TABLE_NUMBER:
      return {
        ...state,
        tableNumber: action.payload
      };
      
    case actionTypes.CLEAR_SESSION:
      return {
        ...state,
        sessionId: null,
        tableNumber: null,
        isSessionActive: false,
        currentView: 'menu'
      };
      
    case actionTypes.SET_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.payload,
        lastActivity: Date.now()
      };
      
    case actionTypes.SET_MOBILE:
      return {
        ...state,
        isMobile: action.payload
      };
      
    case actionTypes.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload
      };
      
    case actionTypes.SHOW_CART:
      return {
        ...state,
        showCart: true
      };
      
    case actionTypes.HIDE_CART:
      return {
        ...state,
        showCart: false
      };
      
    case actionTypes.SHOW_ITEM_MODAL:
      return {
        ...state,
        showItemModal: true,
        selectedMenuItem: action.payload
      };
      
    case actionTypes.HIDE_ITEM_MODAL:
      return {
        ...state,
        showItemModal: false,
        selectedMenuItem: null
      };
      
    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: uuidv4(),
          timestamp: Date.now(),
          ...action.payload
        }]
      };
      
    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
      
    case actionTypes.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
      
    case actionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
      
    case actionTypes.SET_LANGUAGE:
      return {
        ...state,
        language: action.payload
      };
      
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case actionTypes.UPDATE_ACTIVITY:
      return {
        ...state,
        lastActivity: Date.now()
      };
      
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    // Session actions
    setSession: (sessionId, tableNumber) => {
      dispatch({
        type: actionTypes.SET_SESSION,
        payload: { sessionId, tableNumber }
      });
    },
    
    setTableNumber: (tableNumber) => {
      dispatch({
        type: actionTypes.SET_TABLE_NUMBER,
        payload: tableNumber
      });
    },
    
    clearSession: () => {
      dispatch({ type: actionTypes.CLEAR_SESSION });
    },
    
    // UI actions
    setCurrentView: (view) => {
      dispatch({
        type: actionTypes.SET_CURRENT_VIEW,
        payload: view
      });
    },
    
    setMobile: (isMobile) => {
      dispatch({
        type: actionTypes.SET_MOBILE,
        payload: isMobile
      });
    },
    
    setOnlineStatus: (isOnline) => {
      dispatch({
        type: actionTypes.SET_ONLINE_STATUS,
        payload: isOnline
      });
    },
    
    // Modal actions
    showCart: () => {
      dispatch({ type: actionTypes.SHOW_CART });
    },
    
    hideCart: () => {
      dispatch({ type: actionTypes.HIDE_CART });
    },
    
    showItemModal: (menuItem) => {
      dispatch({
        type: actionTypes.SHOW_ITEM_MODAL,
        payload: menuItem
      });
    },
    
    hideItemModal: () => {
      dispatch({ type: actionTypes.HIDE_ITEM_MODAL });
    },
    
    // Notification actions
    addNotification: (notification) => {
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: notification
      });
    },
    
    removeNotification: (id) => {
      dispatch({
        type: actionTypes.REMOVE_NOTIFICATION,
        payload: id
      });
    },
    
    clearNotifications: () => {
      dispatch({ type: actionTypes.CLEAR_NOTIFICATIONS });
    },
    
    // Settings actions
    setTheme: (theme) => {
      dispatch({
        type: actionTypes.SET_THEME,
        payload: theme
      });
    },
    
    setLanguage: (language) => {
      dispatch({
        type: actionTypes.SET_LANGUAGE,
        payload: language
      });
    },
    
    // Performance actions
    setLoading: (isLoading) => {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: isLoading
      });
    },
    
    updateActivity: () => {
      dispatch({ type: actionTypes.UPDATE_ACTIVITY });
    }
  };

  // Auto-generate session ID on mount if not present
  useEffect(() => {
    if (!state.sessionId) {
      const sessionId = uuidv4();
      
      // Try to get table number from URL
      const urlParams = new URLSearchParams(window.location.search);
      const tableFromUrl = urlParams.get('table');
      
      if (tableFromUrl) {
        actions.setSession(sessionId, parseInt(tableFromUrl, 10));
      }
    }
  }, [state.sessionId]);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      actions.setMobile(isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => actions.setOnlineStatus(true);
    const handleOffline = () => actions.setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-remove notifications after timeout
  useEffect(() => {
    const timeouts = state.notifications.map(notification => {
      if (notification.autoRemove !== false) {
        return setTimeout(() => {
          actions.removeNotification(notification.id);
        }, notification.duration || 5000);
      }
      return null;
    }).filter(Boolean);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [state.notifications]);

  // Persist session data to localStorage
  useEffect(() => {
    if (state.sessionId && state.tableNumber) {
      localStorage.setItem('restaurant_session', JSON.stringify({
        sessionId: state.sessionId,
        tableNumber: state.tableNumber,
        timestamp: Date.now()
      }));
    }
  }, [state.sessionId, state.tableNumber]);

  // Load session data from localStorage on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('restaurant_session');
      if (savedSession) {
        const { sessionId, tableNumber, timestamp } = JSON.parse(savedSession);
        
        // Check if session is still valid (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          actions.setSession(sessionId, tableNumber);
        } else {
          localStorage.removeItem('restaurant_session');
        }
      }
    } catch (error) {
      console.error('Error loading session from localStorage:', error);
    }
  }, []);

  const value = {
    ...state,
    ...actions
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export default AppContext;