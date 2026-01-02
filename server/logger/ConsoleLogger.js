const ILogger = require('./ILogger');

/**
 * Console Logger Implementation
 *
 * A simple console-based logger for development and testing.
 * This can also be used as a fallback when no monitoring tool is configured.
 */
class ConsoleLogger extends ILogger {
  constructor(config = {}) {
    super();
    this.enableDebug = config.enableDebug !== false; // Default to true
  }

  _formatMessage(level, message, properties, correlationId) {
    const timestamp = new Date().toISOString();
    const corrId = correlationId ? `[${correlationId}]` : '';
    const props = Object.keys(properties).length > 0 ? JSON.stringify(properties) : '';
    return `${timestamp} ${level} ${corrId} ${message} ${props}`;
  }

  info(message, properties = {}, correlationId = null) {
    console.log(this._formatMessage('[INFO]', message, properties, correlationId));
  }

  warn(message, properties = {}, correlationId = null) {
    console.warn(this._formatMessage('[WARN]', message, properties, correlationId));
  }

  error(message, error = null, properties = {}, correlationId = null) {
    console.error(this._formatMessage('[ERROR]', message, properties, correlationId));
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    } else if (error) {
      console.error('Error details:', error);
    }
  }

  debug(message, properties = {}, correlationId = null) {
    if (this.enableDebug) {
      console.debug(this._formatMessage('[DEBUG]', message, properties, correlationId));
    }
  }

  trackEvent(eventName, properties = {}, measurements = {}, correlationId = null) {
    console.log(this._formatMessage('[EVENT]', eventName, { ...properties, measurements }, correlationId));
  }

  trackMetric(name, value, properties = {}, correlationId = null) {
    console.log(this._formatMessage('[METRIC]', `${name}=${value}`, properties, correlationId));
  }

  trackRequest(requestInfo, correlationId = null) {
    const { method, url, duration, statusCode, userId, userRole } = requestInfo;
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    console.log(this._formatMessage('[REQUEST]', message, { userId, userRole }, correlationId));
  }

  trackDependency(dependencyInfo, correlationId = null) {
    const { type, name, duration, success } = dependencyInfo;
    const message = `${type} - ${name} (${duration}ms, success: ${success})`;
    console.log(this._formatMessage('[DEPENDENCY]', message, {}, correlationId));
  }

  async flush() {
    // Console logger doesn't need to flush
    return Promise.resolve();
  }
}

module.exports = ConsoleLogger;