import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, retryCount } = this.state;
      const isNetworkError = error?.message?.includes('fetch') || 
                           error?.message?.includes('network') ||
                           error?.message?.includes('Failed to load');
      
      return (
        <div className="min-h-screen bg-background-color flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="card p-8">
              {/* Error Icon */}
              <div className="mb-6">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-text-primary mb-4">
                {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
              </h1>

              {/* Error Message */}
              <p className="text-text-secondary mb-6">
                {isNetworkError 
                  ? 'Unable to connect to our servers. Please check your internet connection and try again.'
                  : 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.'
                }
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 overflow-auto">
                    <div className="font-medium mb-2">Error:</div>
                    <div className="mb-3">{error.toString()}</div>
                    {this.state.errorInfo && (
                      <>
                        <div className="font-medium mb-2">Component Stack:</div>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}

              {/* Retry Count Warning */}
              {retryCount > 2 && (
                <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    You've retried several times. If the problem continues, 
                    please contact support or try again later.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="btn btn-primary w-full"
                  disabled={retryCount > 5}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {retryCount > 5 ? 'Too many retries' : 'Try Again'}
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="btn btn-secondary w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-xs text-text-light">
                <p>
                  Error ID: {Date.now().toString(36)}
                  {retryCount > 0 && ` • Retry #${retryCount}`}
                </p>
                <p className="mt-1">
                  If you need help, please provide this error ID to support.
                </p>
              </div>
            </div>

            {/* Additional Help */}
            <div className="mt-6 text-sm text-text-secondary">
              <p>Need immediate assistance?</p>
              <p>Ask your server for help or scan a new QR code.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for functional components
export const withErrorBoundary = (Component, fallback) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const handleError = (error, errorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // In a real app, you might dispatch to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorTrackingService.captureException(error, errorInfo);
    }
  };

  return handleError;
};

export default ErrorBoundary;