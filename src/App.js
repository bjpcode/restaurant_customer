import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingStates from './components/LoadingStates';
import NotificationToast from './components/NotificationToast';

// Lazy load components for better performance
const QRLanding = React.lazy(() => import('./components/QRLanding'));
const TableSelect = React.lazy(() => import('./components/TableSelect'));
const MenuContainer = React.lazy(() => import('./components/MenuContainer'));
const OrderHistory = React.lazy(() => import('./components/OrderHistory'));
const ItemDetailModal = React.lazy(() => import('./components/ItemDetailModal'));

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const tableFromUrl = urlParams.get('table');
  const savedSession = localStorage.getItem('restaurant_session');
  
  // Check if user has valid session or table parameter
  if (!tableFromUrl && !savedSession) {
    return <Navigate to="/table-select" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="App">
            {/* Global Notification System */}
            <NotificationToast />

            {/* Route Configuration */}
            <Suspense fallback={<LoadingStates.FullPage message="Loading..." />}>
              <Routes>
                {/* QR Code Landing - when user scans QR */}
                <Route 
                  path="/qr" 
                  element={<QRLanding />} 
                />
                
                {/* Manual Table Selection */}
                <Route 
                  path="/table-select" 
                  element={<TableSelect />} 
                />
                
                {/* Protected Routes - require valid session */}
                <Route 
                  path="/menu" 
                  element={
                    <ProtectedRoute>
                      <MenuContainer />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Default route - redirect based on context */}
                <Route 
                  path="/" 
                  element={<DefaultRedirect />} 
                />
                
                {/* Catch all - redirect to appropriate page */}
                <Route 
                  path="*" 
                  element={<Navigate to="/" replace />} 
                />
              </Routes>
            </Suspense>

            {/* Global Modal Container */}
            <ModalContainer />
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

// Component to handle default redirects based on URL parameters and session
const DefaultRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tableFromUrl = urlParams.get('table');
  const savedSession = localStorage.getItem('restaurant_session');
  
  // If URL has table parameter, go to QR landing for validation
  if (tableFromUrl) {
    return <Navigate to={`/qr?table=${tableFromUrl}`} replace />;
  }
  
  // If user has saved session, go to menu
  if (savedSession) {
    try {
      const { timestamp } = JSON.parse(savedSession);
      // Check if session is still valid (24 hours)
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return <Navigate to="/menu" replace />;
      }
    } catch (error) {
      // Invalid session data, clear it
      localStorage.removeItem('restaurant_session');
    }
  }
  
  // No valid session or table, go to manual table selection
  return <Navigate to="/table-select" replace />;
};

// Container for global modals
const ModalContainer = () => {
  // For now, we'll handle modals within individual components
  // This could be extended for global modal management
  return null;
};

export default App;