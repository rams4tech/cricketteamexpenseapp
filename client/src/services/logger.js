import { ApplicationInsights } from '@microsoft/applicationinsights-web';

/**
 * Client-Side Logger
 *
 * Provides logging capabilities for the React application with Application Insights integration.
 * Supports end-to-end request tracing with correlation IDs.
 */

class ClientLogger {
  constructor(config = {}) {
    this.isEnabled = false;
    this.appInsights = null;
    this.config = config;

    if (config.instrumentationKey) {
      try {
        this.appInsights = new ApplicationInsights({
          config: {
            instrumentationKey: config.instrumentationKey,
            enableAutoRouteTracking: true,  // Track route changes
            enableCorsCorrelation: true,     // Enable cross-origin correlation
            enableRequestHeaderTracking: true,
            enableResponseHeaderTracking: true,
            correlationHeaderExcludedDomains: ['*.queue.core.windows.net'],
            disableFetchTracking: false,
            enableAjaxPerfTracking: true,
            maxAjaxCallsPerView: 500
          }
        });

        this.appInsights.loadAppInsights();

        // Set cloud role name
        if (config.cloudRoleName) {
          this.appInsights.context.application.name = config.cloudRoleName;
        }

        // Set user context if available
        if (config.userId) {
          this.appInsights.setAuthenticatedUserContext(config.userId);
        }

        this.isEnabled = true;
        console.log('Application Insights initialized for client');
      } catch (error) {
        console.error('Failed to initialize Application Insights:', error);
        this.isEnabled = false;
      }
    } else {
      console.warn('Application Insights instrumentation key not provided for client. Logging will fall back to console.');
    }
  }

  /**
   * Set authenticated user context
   */
  setUser(userId, accountId = null) {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.setAuthenticatedUserContext(userId, accountId);
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser() {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.clearAuthenticatedUserContext();
    }
  }

  /**
   * Log an informational message
   */
  info(message, properties = {}) {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.trackTrace({
        message,
        severityLevel: 1, // Information
        properties
      });
    }
    console.log(`[INFO] ${message}`, properties);
  }

  /**
   * Log a warning message
   */
  warn(message, properties = {}) {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.trackTrace({
        message,
        severityLevel: 2, // Warning
        properties
      });
    }
    console.warn(`[WARN] ${message}`, properties);
  }

  /**
   * Log an error message
   */
  error(message, error = null, properties = {}) {
    if (this.isEnabled && this.appInsights) {
      if (error instanceof Error) {
        this.appInsights.trackException({
          exception: error,
          properties: {
            ...properties,
            message
          },
          severityLevel: 3 // Error
        });
      } else {
        this.appInsights.trackTrace({
          message: `${message}${error ? ': ' + error : ''}`,
          severityLevel: 3,
          properties
        });
      }
    }

    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, error, properties);
    } else {
      console.error(`[ERROR] ${message}`, error, properties);
    }
  }

  /**
   * Track a custom event (e.g., button clicks, user actions)
   */
  trackEvent(eventName, properties = {}, measurements = {}) {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.trackEvent({
        name: eventName,
        properties,
        measurements
      });
    }
    console.log(`[EVENT] ${eventName}`, { properties, measurements });
  }

  /**
   * Track a page view
   */
  trackPageView(pageName, url = window.location.href, properties = {}) {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.trackPageView({
        name: pageName,
        uri: url,
        properties
      });
    }
    console.log(`[PAGE_VIEW] ${pageName}`, { url, properties });
  }

  /**
   * Track a custom metric
   */
  trackMetric(name, value, properties = {}) {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.trackMetric({
        name,
        average: value,
        properties
      });
    }
    console.log(`[METRIC] ${name}: ${value}`, properties);
  }

  /**
   * Start tracking a timed event
   * Returns a function to stop tracking
   */
  startTrackEvent(eventName) {
    const startTime = Date.now();

    return (properties = {}, measurements = {}) => {
      const duration = Date.now() - startTime;
      this.trackEvent(eventName, properties, {
        ...measurements,
        duration
      });
    };
  }

  /**
   * Track an API call manually (useful for custom tracking)
   */
  trackApiCall(method, url, duration, statusCode, success, properties = {}) {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.trackDependencyData({
        name: `${method} ${url}`,
        data: url,
        duration,
        success,
        responseCode: statusCode,
        type: 'HTTP',
        properties
      });
    }
    console.log(`[API_CALL] ${method} ${url} - ${statusCode} (${duration}ms)`, properties);
  }

  /**
   * Flush any pending telemetry
   */
  flush() {
    if (this.isEnabled && this.appInsights) {
      this.appInsights.flush();
    }
  }

  /**
   * Get the Application Insights instance for advanced usage
   */
  getAppInsights() {
    return this.appInsights;
  }
}

// Singleton instance
let loggerInstance = null;

/**
 * Initialize the logger with configuration
 */
export const initializeLogger = (config) => {
  if (!loggerInstance) {
    loggerInstance = new ClientLogger(config);
  }
  return loggerInstance;
};

/**
 * Get the logger instance
 */
export const getLogger = () => {
  if (!loggerInstance) {
    // Initialize with default config if not already initialized
    loggerInstance = new ClientLogger({});
  }
  return loggerInstance;
};

const loggerExports = {
  initializeLogger,
  getLogger
};

export default loggerExports;