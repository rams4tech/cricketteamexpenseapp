import React from 'react';
import { getLogger } from '../services/logger';

/**
 * Error Boundary Component
 *
 * Catches React errors and logs them to Application Insights.
 * Displays a fallback UI when an error occurs.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
    this.logger = getLogger();
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to Application Insights
    this.logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown'
    });

    // Track as a custom event
    this.logger.trackEvent('ReactError', {
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown'
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Log the reset action
    this.logger.trackEvent('ErrorBoundaryReset', {
      errorBoundary: this.props.name || 'Unknown'
    });

    // Optionally reload the page or navigate somewhere
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="container mt-5">
          <div className="alert alert-danger">
            <h4 className="alert-heading">Oops! Something went wrong</h4>
            <p>We're sorry, but something unexpected happened. The error has been logged and we'll look into it.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3">
                <summary style={{ cursor: 'pointer' }}>Error Details (Development Only)</summary>
                <pre className="mt-2" style={{ fontSize: '0.85rem' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <hr />
            <button className="btn btn-primary" onClick={this.handleReset}>
              Try Again
            </button>
            <button
              className="btn btn-secondary ms-2"
              onClick={() => window.location.href = '/'}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;