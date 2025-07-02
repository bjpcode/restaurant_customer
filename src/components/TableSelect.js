import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Utensils } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const TableSelect = () => {
  const navigate = useNavigate();
  const { setSession, sessionId, addNotification } = useApp();
  const [tableNumber, setTableNumber] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const tableNum = parseInt(tableNumber, 10);
    
    if (!tableNumber || isNaN(tableNum) || tableNum <= 0) {
      addNotification({
        type: 'error',
        message: 'Please enter a valid table number',
        duration: 3000
      });
      return;
    }

    setIsValidating(true);

    try {
      // Simulate table validation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, assume tables 1-50 are valid
      if (tableNum >= 1 && tableNum <= 50) {
        const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSession(newSessionId, tableNum);
        
        addNotification({
          type: 'success',
          message: `Welcome to Table ${tableNum}!`,
          duration: 3000
        });

        navigate('/menu');
      } else {
        addNotification({
          type: 'error',
          message: 'Table not found or inactive',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error validating table:', error);
      addNotification({
        type: 'error',
        message: 'Error validating table. Please try again.',
        duration: 5000
      });
    } finally {
      setIsValidating(false);
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
            Table Selection
          </h1>
          <p className="text-text-secondary">
            Enter your table number to start ordering
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="table" className="block text-sm font-medium text-text-primary mb-2">
                Table Number
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  id="table"
                  type="number"
                  min="1"
                  max="100"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter table number (e.g., 15)"
                  className="form-control pl-10"
                  disabled={isValidating}
                  autoFocus
                />
              </div>
              <p className="text-xs text-text-light mt-2">
                Look for the table number on your table or ask your server
              </p>
            </div>

            <button
              type="submit"
              disabled={!tableNumber || isValidating}
              className="btn btn-primary w-full btn-lg"
            >
              {isValidating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner" />
                  <span>Validating...</span>
                </div>
              ) : (
                <>
                  <span>Continue to Menu</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-text-light mb-4">
            Can't find your table number?
          </p>
          <p className="text-xs text-text-secondary">
            Ask your server for assistance or scan the QR code on your table
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default TableSelect;