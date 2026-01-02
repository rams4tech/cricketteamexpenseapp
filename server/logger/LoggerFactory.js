const ApplicationInsightsLogger = require('./ApplicationInsightsLogger');
const ConsoleLogger = require('./ConsoleLogger');

/**
 * Logger Factory
 *
 * Central factory for creating logger instances.
 * This allows you to easily switch between different logging implementations
 * by changing the configuration, without modifying application code.
 */
class LoggerFactory {
  /**
   * Create a logger instance based on configuration
   *
   * @param {Object} config - Logger configuration
   * @param {string} config.type - Logger type: 'applicationInsights', 'console', etc.
   * @param {string} config.instrumentationKey - Application Insights instrumentation key
   * @param {string} config.cloudRoleName - Application name for Application Insights
   * @param {boolean} config.enableLiveMetrics - Enable live metrics streaming
   * @param {boolean} config.enableDebug - Enable debug logging (for console logger)
   * @returns {ILogger} Logger instance
   */
  static createLogger(config = {}) {
    const loggerType = config.type || 'console';

    switch (loggerType.toLowerCase()) {
      case 'applicationinsights':
      case 'appinsights':
        if (!config.instrumentationKey) {
          console.warn('Application Insights instrumentation key not provided. Falling back to Console Logger.');
          return new ConsoleLogger(config);
        }
        return new ApplicationInsightsLogger(config.instrumentationKey, {
          cloudRoleName: config.cloudRoleName || 'CricketExpenseApp',
          enableLiveMetrics: config.enableLiveMetrics || false
        });

      case 'console':
        return new ConsoleLogger(config);

      // Add more logger implementations here in the future
      // case 'datadog':
      //   return new DatadogLogger(config);
      // case 'newrelic':
      //   return new NewRelicLogger(config);

      default:
        console.warn(`Unknown logger type: ${loggerType}. Falling back to Console Logger.`);
        return new ConsoleLogger(config);
    }
  }
}

module.exports = LoggerFactory;