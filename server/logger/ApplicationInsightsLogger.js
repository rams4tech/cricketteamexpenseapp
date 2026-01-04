const appInsights = require('applicationinsights');
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
      if (connectionString) {
        console.log('Initializing Application Insights with connection string');
        appInsights.setup(connectionString);
      } else {
        console.log('Initializing Application Insights with instrumentation key');
        appInsights.setup(instrumentationKey);
      }

      appInsights
        .setAutoCollectRequests(true)       // Auto-collect HTTP requests
        .setAutoCollectPerformance(true)    // Auto-collect performance counters
        .setAutoCollectExceptions(true)     // Auto-collect exceptions
        .setAutoCollectDependencies(true)   // Auto-collect dependencies (DB, HTTP)
        .setAutoCollectConsole(true)        // Auto-collect console logs
        .setUseDiskRetryCaching(true)       // Retry on network failures
        .setSendLiveMetrics(config.enableLiveMetrics || false)  // Live metrics stream
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);  // W3C trace context

      // Set cloud role name for better filtering in Azure
      if (config.cloudRoleName) {
        appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = config.cloudRoleName;
      }

      // Start collection
      appInsights.start();

      this.client = appInsights.defaultClient;
      this.isEnabled = !!(this.client && appInsights.Contracts);

      if (this.isEnabled) {
        console.log('Application Insights initialized successfully');
      } else {
        console.warn('Application Insights started but client not ready. Falling back to console logging.');
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

    if (this.isEnabled && this.client && appInsights.Contracts?.SeverityLevel) {
      this.client.trackTrace({
        message,
        severity: appInsights.Contracts.SeverityLevel.Information,
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

    if (this.isEnabled && this.client && appInsights.Contracts?.SeverityLevel) {
      this.client.trackTrace({
        message,
        severity: appInsights.Contracts.SeverityLevel.Warning,
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
      } else if (appInsights.Contracts?.SeverityLevel) {
        this.client.trackTrace({
          message: `${message}${error ? ': ' + error : ''}`,
          severity: appInsights.Contracts.SeverityLevel.Error,
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

    if (this.isEnabled && this.client && appInsights.Contracts?.SeverityLevel) {
      this.client.trackTrace({
        message,
        severity: appInsights.Contracts.SeverityLevel.Verbose,
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