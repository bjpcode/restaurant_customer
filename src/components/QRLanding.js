import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, Utensils } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const QRLanding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession, sessionId, tableNumber, addNotification } = useApp();
  
  const [validationState, setValidationState] = useState('validating'); // validating, valid, invalid
  const [tableNum, setTableNum] = useState(null);

  useEffect(() => {
    const validateTableFromUrl = async () => {
      try {
        const tableFromUrl = searchParams.get('table');
        
        if (!tableFromUrl) {
          setValidationState('invalid');
          addNotification({
            type: 'error',
            message: 'No table number found in QR code',
            duration: 5000
          });
          return;
        }

        const tableNumber = parseInt(tableFromUrl, 10);
        
        if (isNaN(tableNumber) || tableNumber <= 0) {
          setValidationState('invalid');
          addNotification({
            type: 'error',
            message: 'Invalid table number',
            duration: 5000
          });
          return;
        }

        setTableNum(tableNumber);

        // Simulate table validation (in real app, this would call validateTable API)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // For demo purposes, assume all tables 1-50 are valid
        if (tableNumber >= 1 && tableNumber <= 50) {
          setValidationState('valid');
          
          // Generate session ID and set session
          const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setSession(newSessionId, tableNumber);
          
          addNotification({
            type: 'success',
            message: `Welcome to Table ${tableNumber}!`,
            duration: 3000
          });

          // Auto-redirect to menu after success
          setTimeout(() => {
            navigate('/menu');
          }, 2000);
        } else {
          setValidationState('invalid');
          addNotification({
            type: 'error',
            message: 'Table not found or inactive',
            duration: 5000
          });
        }
      } catch (error) {
        console.error('Error validating table:', error);
        setValidationState('invalid');
        addNotification({
          type: 'error',
          message: 'Error validating table. Please try again.',
          duration: 5000
        });
      }
    };

    validateTableFromUrl();
  }, [searchParams, sessionId, setSession, addNotification, navigate]);

  const handleManualEntry = () => {
    navigate('/table-select');
  };

  const handleRetry = () => {
    setValidationState('validating');
    window.location.reload();
  };

  const renderValidationContent = () => {
    switch (validationState) {
      case 'validating':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mb-6"
            >
              <Loader2 className="w-16 h-16 text-primary-color mx-auto" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Validating Table...
            </h2>
            <p className="text-text-secondary">
              {tableNum ? `Checking Table ${tableNum}` : 'Processing QR code'}
            </p>
          </motion.div>
        );

      case 'valid':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Welcome to Table {tableNum}!
            </h2>
            <p className="text-text-secondary mb-6">
              You're all set to start ordering. Redirecting to menu...
            </p>
            <div className="flex justify-center">
              <div className="w-8 h-1 bg-primary-color rounded-full animate-pulse"></div>
            </div>
          </motion.div>
        );

      case 'invalid':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Invalid QR Code
            </h2>
            <p className="text-text-secondary mb-8">
              We couldn't validate your table. Please try scanning the QR code again or enter your table number manually.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleRetry}
                className="btn btn-primary w-full"
              >
                Try Again
              </button>
              <button
                onClick={handleManualEntry}
                className="btn btn-secondary w-full"
              >
                Enter Table Number
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-color flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-primary-color rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Restaurant Order
          </h1>
          <p className="text-text-secondary">
            Quick & Easy Table Service
          </p>
        </motion.div>

        {/* Validation Content */}
        <div className="card p-8">
          {renderValidationContent()}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-text-light">
            Having trouble? Ask your server for assistance
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default QRLanding;