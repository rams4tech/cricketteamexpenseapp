/**
 * Abstract Logger Interface
 *
 * This interface defines the contract for all logging implementations.
 * By implementing this interface, you can easily swap between different
 * monitoring tools (Application Insights, Datadog, New Relic, etc.)
 * without changing your application code.
 */

class ILogger {
  /**
   * Log an informational message
   * @param {string} message - The log message
   * @param {Object} properties - Additional properties/metadata
   * @param {string} correlationId - Request correlation ID for tracing
   */
  info(message, properties = {}, correlationId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Log a warning message
   * @param {string} message - The warning message
   * @param {Object} properties - Additional properties/metadata
   * @param {string} correlationId - Request correlation ID for tracing
   */
  warn(message, properties = {}, correlationId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Log an error message
   * @param {string} message - The error message
   * @param {Error} error - Error object with stack trace
   * @param {Object} properties - Additional properties/metadata
   * @param {string} correlationId - Request correlation ID for tracing
   */
  error(message, error = null, properties = {}, correlationId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Log a debug message (typically not sent to production monitoring)
   * @param {string} message - The debug message
   * @param {Object} properties - Additional properties/metadata
   * @param {string} correlationId - Request correlation ID for tracing
   */
  debug(message, properties = {}, correlationId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Track a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} properties - Event properties
   * @param {Object} measurements - Numeric measurements (e.g., duration, count)
   * @param {string} correlationId - Request correlation ID for tracing
   */
  trackEvent(eventName, properties = {}, measurements = {}, correlationId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Track a custom metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} properties - Additional properties
   * @param {string} correlationId - Request correlation ID for tracing
   */
  trackMetric(name, value, properties = {}, correlationId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Track an HTTP request
   * @param {Object} requestInfo - Request information (method, url, duration, statusCode, etc.)
   * @param {string} correlationId - Request correlation ID for tracing
   */
  trackRequest(requestInfo, correlationId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Track a dependency call (e.g., database, external API)
   * @param {Object} dependencyInfo - Dependency information (type, target, name, data, duration, success)
   * @param {string} correlationId - Request correlation ID for tracing
   */
  trackDependency(dependencyInfo, correlationId = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Flush any pending logs (useful for serverless environments)
   */
  async flush() {
    throw new Error('Method not implemented');
  }
}

module.exports = ILogger;