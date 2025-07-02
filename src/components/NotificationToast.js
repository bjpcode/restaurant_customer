import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const NotificationToast = () => {
  const { notifications, removeNotification } = useApp();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: 'text-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-500'
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {notifications.map((notification) => {
          const styles = getStyles(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`
                ${styles.bg} border rounded-lg p-4 shadow-lg
                backdrop-blur-sm relative overflow-hidden
              `}
            >
              {/* Progress bar */}
              {notification.duration && notification.autoRemove !== false && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: notification.duration / 1000, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
                />
              )}

              <div className="flex items-start space-x-3">
                <div className={styles.icon}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <h4 className={`font-medium ${styles.text} mb-1`}>
                      {notification.title}
                    </h4>
                  )}
                  <p className={`text-sm ${styles.text}`}>
                    {notification.message}
                  </p>
                  
                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className={`
                        text-sm font-medium underline mt-2 hover:no-underline
                        ${styles.text}
                      `}
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`
                    p-1 rounded hover:bg-black hover:bg-opacity-10 
                    transition-colors ${styles.icon}
                  `}
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;