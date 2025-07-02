import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Skeleton component for consistent loading animations
const Skeleton = ({ className = "", animate = true }) => (
  <div className={`skeleton ${animate ? 'animate-pulse' : ''} ${className}`} />
);

// Menu item skeleton
const MenuItemSkeleton = () => (
  <div className="card p-4">
    <div className="flex space-x-4">
      <Skeleton className="w-24 h-24 rounded-lg" />
      <div className="flex-1 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// Category tab skeleton
const CategoryTabSkeleton = () => (
  <div className="flex space-x-2 px-4 py-4">
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="h-10 w-20 rounded-full" />
    ))}
  </div>
);

// Cart item skeleton
const CartItemSkeleton = () => (
  <div className="card p-4">
    <div className="flex space-x-3">
      <Skeleton className="w-16 h-16 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-16" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  </div>
);

// Order item skeleton
const OrderItemSkeleton = () => (
  <div className="card p-4">
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex justify-between text-sm">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="border-t border-border-color pt-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex justify-between py-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Spinning loader component
const SpinningLoader = ({ size = 'md', className = "" }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} ${className}`}
    >
      <Loader2 className="w-full h-full text-primary-color" />
    </motion.div>
  );
};

// Pulsing dots loader
const PulsingDots = ({ className = "" }) => (
  <div className={`flex space-x-1 ${className}`}>
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-primary-color rounded-full"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.2
        }}
      />
    ))}
  </div>
);

// Wave loader
const WaveLoader = ({ className = "" }) => (
  <div className={`flex items-end space-x-1 ${className}`}>
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1 bg-primary-color rounded-full"
        animate={{ height: [8, 24, 8] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.1
        }}
      />
    ))}
  </div>
);

// Full page loading screen
const FullPageLoader = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-background-color flex items-center justify-center">
    <div className="text-center">
      <SpinningLoader size="xl" className="mb-6 mx-auto" />
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        {message}
      </h2>
      <PulsingDots />
    </div>
  </div>
);

// Menu grid loading state
const MenuGridLoader = ({ count = 6 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
      >
        <MenuItemSkeleton />
      </motion.div>
    ))}
  </div>
);

// Cart loading state
const CartLoader = () => (
  <div className="space-y-4 p-4">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
      >
        <CartItemSkeleton />
      </motion.div>
    ))}
  </div>
);

// Orders loading state
const OrdersLoader = ({ count = 3 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.15 }}
      >
        <OrderItemSkeleton />
      </motion.div>
    ))}
  </div>
);

// Inline loading state for buttons
const ButtonLoader = ({ text = "Loading..." }) => (
  <div className="flex items-center justify-center space-x-2">
    <SpinningLoader size="sm" />
    <span>{text}</span>
  </div>
);

// Search loading state
const SearchLoader = () => (
  <div className="text-center py-8">
    <WaveLoader className="mb-4 justify-center" />
    <p className="text-text-secondary">Searching menu...</p>
  </div>
);

// Network loading state
const NetworkLoader = ({ isRetrying = false }) => (
  <div className="text-center py-8">
    <SpinningLoader size="lg" className="mb-4 mx-auto" />
    <h3 className="text-lg font-semibold text-text-primary mb-2">
      {isRetrying ? 'Retrying...' : 'Connecting...'}
    </h3>
    <p className="text-text-secondary">
      {isRetrying ? 'Attempting to reconnect' : 'Establishing connection'}
    </p>
  </div>
);

// Empty state with loading option
const EmptyStateLoader = ({ 
  title = "Loading...", 
  subtitle = "Please wait while we fetch your data",
  showLoader = true 
}) => (
  <div className="text-center py-12">
    {showLoader && <SpinningLoader size="lg" className="mb-6 mx-auto" />}
    <h3 className="text-xl font-semibold text-text-primary mb-2">
      {title}
    </h3>
    <p className="text-text-secondary">
      {subtitle}
    </p>
  </div>
);

// Export all loading components
const LoadingStates = {
  Skeleton,
  MenuItem: MenuItemSkeleton,
  CategoryTab: CategoryTabSkeleton,
  CartItem: CartItemSkeleton,
  OrderItem: OrderItemSkeleton,
  Spinner: SpinningLoader,
  PulsingDots,
  Wave: WaveLoader,
  FullPage: FullPageLoader,
  MenuGrid: MenuGridLoader,
  Cart: CartLoader,
  Orders: OrdersLoader,
  Button: ButtonLoader,
  Search: SearchLoader,
  Network: NetworkLoader,
  EmptyState: EmptyStateLoader
};

export default LoadingStates;