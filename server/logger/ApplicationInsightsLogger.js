const appInsights = require('applicationinsights');
const { KnownSeverityLevel } = require('applicationinsights');
const ILogger = require('./ILogger');

/**
 * Application Insights Logger Implementation
 *
 * This class implements the ILogger interface using Azure Application Insights.
 * It provides comprehensive logging and monitoring capabilities including
 * distributed tracing, custom events, metrics, and dependencies.
 */
class ApplicationInsightsLogger extends ILogger {
  constructor(connectionStringOrKey, config = {}) {
    super();

    // Accept either connection string or instrumentation key
    const connectionString = config.connectionString || (connectionStringOrKey && connectionStringOrKey.includes('InstrumentationKey=') ? connectionStringOrKey : null);
    const instrumentationKey = connectionString ? null : (config.instrumentationKey || connectionStringOrKey);

    if (!connectionString && !instrumentationKey) {
      console.warn('Application Insights connection string or instrumentation key not provided. Logging will fall back to console.');
      this.isEnabled = false;
      return;
    }

    try {
      // Setup Application Insights with connection string (preferred) or instrumentation key
      // v3.x SDK uses different initialization
      if (connectionString) {
        console.log('Initializing Application Insights with connection string');
        appInsights.setup(connectionString).start();
      } else {
        console.log('Initializing Application Insights with instrumentation key');
        appInsights.setup(instrumentationKey).start();
      }

      this.client = appInsights.defaultClient;

      // Configure after initialization
      if (this.client) {
        // Set cloud role name for better filtering in Azure
        if (config.cloudRoleName && this.client.context && this.client.context.tags) {
          this.client.context.tags['ai.cloud.role'] = config.cloudRoleName;
        }

        console.log('Application Insights initialized successfully');
        this.isEnabled = true;
      } else {
        console.warn('Application Insights client not available. Falling back to console logging.');
        this.isEnabled = false;
      }
    } catch (error) {
      console.error('Failed to initialize Application Insights:', error.message);
      console.warn('Falling back to console-only logging');
      this.isEnabled = false;
      this.client = null;
    }
  }

  /**
   * Add correlation context to telemetry
   */
  _addCorrelationContext(properties, correlationId) {
    if (correlationId) {
      return {
        ...properties,
        correlationId,
        operationId: correlationId
      };
    }
    return properties;
  }

  /**
   * Log an informational message
   */
  info(message, properties = {}, correlationId = null) {
    const enrichedProps = this._addCorrelationContext(properties, correlationId);

    if (this.isEnabled && this.client && KnownSeverityLevel) {
      this.client.trackTrace({
        message,
        severity: KnownSeverityLevel.Information,
        properties: enrichedProps
      });
    }

    console.log(`[INFO] ${message}`, enrichedProps);
  }

  /**
   * Log a warning message
   */
  warn(message, properties = {}, correlationId = null) {
    const enrichedProps = this._addCorrelationContext(properties, correlationId);

    if (this.isEnabled && this.client && KnownSeverityLevel) {
      this.client.trackTrace({
        message,
        severity: KnownSeverityLevel.Warning,
        properties: enrichedProps
      });
    }

    console.warn(`[WARN] ${message}`, enrichedProps);
  }

  /**
   * Log an error message
   */
  error(message, error = null, properties = {}, correlationId = null) {
    const enrichedProps = this._addCorrelationContext(properties, correlationId);

    if (this.isEnabled && this.client) {
      if (error instanceof Error) {
        this.client.trackException({
          exception: error,
          properties: {
            ...enrichedProps,
            message
          }
        });
      } else if (KnownSeverityLevel) {
        this.client.trackTrace({
          message: `${message}${error ? ': ' + error : ''}`,
          severity: KnownSeverityLevel.Error,
          properties: enrichedProps
        });
      }
    }

    console.error(`[ERROR] ${message}`, error, enrichedProps);
  }

  /**
   * Log a debug message
   */
  debug(message, properties = {}, correlationId = null) {
    const enrichedProps = this._addCorrelationContext(properties, correlationId);

    if (this.isEnabled && this.client && KnownSeverityLevel) {
      this.client.trackTrace({
        message,
        severity: KnownSeverityLevel.Verbose,
        properties: enrichedProps
      });
    }

    console.debug(`[DEBUG] ${message}`, enrichedProps);
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName, properties = {}, measurements = {}, correlationId = null) {
    const enrichedProps = this._addCorrelationContext(properties, correlationId);

    if (this.isEnabled && this.client) {
      this.client.trackEvent({
        name: eventName,
        properties: enrichedProps,
        measurements
      });
    }

    console.log(`[EVENT] ${eventName}`, { properties: enrichedProps, measurements });
  }

  /**
   * Track a custom metric
   */
  trackMetric(name, value, properties = {}, correlationId = null) {
    const enrichedProps = this._addCorrelationContext(properties, correlationId);

    if (this.isEnabled && this.client) {
      this.client.trackMetric({
        name,
        value,
        properties: enrichedProps
      });
    }

    console.log(`[METRIC] ${name}: ${value}`, enrichedProps);
  }

  /**
   * Track an HTTP request
   */
  trackRequest(requestInfo, correlationId = null) {
    const {
      method,
      url,
      duration,
      statusCode,
      success,
      userId,
      userRole,
      properties = {}
    } = requestInfo;

    const enrichedProps = this._addCorrelationContext(properties, correlationId);

    if (this.isEnabled && this.client) {
      this.client.trackRequest({
        name: `${method} ${url}`,
        url,
        duration,
        resultCode: statusCode,
        success,
        properties: {
          ...enrichedProps,
          method,
          userId,
          userRole
        }
      });
    }

    console.log(`[REQUEST] ${method} ${url} - ${statusCode} (${duration}ms)`, enrichedProps);
  }

  /**
   * Track a dependency call (e.g., database, external API)
   */
  trackDependency(dependencyInfo, correlationId = null) {
    const {
      type,           // 'SQL', 'HTTP', etc.
      target,         // Database name, API host
      name,           // Operation name
      data,           // SQL query, API endpoint, etc.
      duration,       // Duration in ms
      success,        // Boolean
      resultCode,     // Status code or error code
      properties = {}
    } = dependencyInfo;

    const enrichedProps = this._addCorrelationContext(properties, correlationId);

    if (this.isEnabled && this.client) {
      this.client.trackDependency({
        target,
        name,
        data,
        duration,
        success,
        resultCode: resultCode || (success ? 200 : 500),
        dependencyTypeName: type,
        properties: enrichedProps
      });
    }

    console.log(`[DEPENDENCY] ${type} - ${name} (${duration}ms, success: ${success})`, enrichedProps);
  }

  /**
   * Flush any pending logs
   */
  async flush() {
    if (this.isEnabled && this.client) {
      return new Promise((resolve) => {
        this.client.flush({
          callback: () => {
            console.log('Application Insights telemetry flushed');
            resolve();
          }
        });
      });
    }
  }

  /**
   * Get the Application Insights client for advanced scenarios
   */
  getClient() {
    return this.client;
  }
}

module.exports = ApplicationInsightsLogger;