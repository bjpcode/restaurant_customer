import React from 'react';
import { Clock, MapPin, Receipt } from 'lucide-react';

const CartSummary = ({ 
  subtotal = 0, 
  total = 0, 
  estimatedTime = 0, 
  itemCount = 0,
  tableNumber = null,
  taxAmount = 0,
  serviceCharge = 0,
  discount = 0
}) => {
  const formatPrice = (price) => `$${price.toFixed(2)}`;
  
  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Calculate breakdown if we have additional charges
  const hasBreakdown = taxAmount > 0 || serviceCharge > 0 || discount > 0;

  return (
    <div className="bg-background-color border-t border-border-color p-4 space-y-4">
      {/* Order Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          {tableNumber && (
            <div className="flex items-center space-x-1 text-text-secondary">
              <MapPin className="w-4 h-4" />
              <span>Table {tableNumber}</span>
            </div>
          )}
          
          {itemCount > 0 && (
            <div className="flex items-center space-x-1 text-text-secondary">
              <Receipt className="w-4 h-4" />
              <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {estimatedTime > 0 && (
            <div className="flex items-center space-x-1 text-text-secondary">
              <Clock className="w-4 h-4" />
              <span>{formatTime(estimatedTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Subtotal</span>
          <span className="font-medium text-text-primary">
            {formatPrice(subtotal)}
          </span>
        </div>

        {/* Tax */}
        {taxAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Tax</span>
            <span className="font-medium text-text-primary">
              {formatPrice(taxAmount)}
            </span>
          </div>
        )}

        {/* Service Charge */}
        {serviceCharge > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Service Charge</span>
            <span className="font-medium text-text-primary">
              {formatPrice(serviceCharge)}
            </span>
          </div>
        )}

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-green-600">Discount</span>
            <span className="font-medium text-green-600">
              -{formatPrice(discount)}
            </span>
          </div>
        )}

        {/* Divider if we have breakdown */}
        {hasBreakdown && (
          <div className="border-t border-border-color pt-2" />
        )}

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold">
          <span className="text-text-primary">Total</span>
          <span className="text-primary-color">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Estimated Prep Time Highlight */}
      {estimatedTime > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-blue-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Estimated preparation time: {formatTime(estimatedTime)}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            We'll notify you when your order is ready
          </p>
        </div>
      )}

      {/* Empty state message */}
      {itemCount === 0 && (
        <div className="text-center text-text-secondary py-4">
          <p className="text-sm">Your cart is empty</p>
        </div>
      )}
    </div>
  );
};

export default CartSummary;