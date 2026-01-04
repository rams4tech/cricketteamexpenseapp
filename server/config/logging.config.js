/**
 * Logging Configuration
 *
 * Configure your logging implementation here.
 * To switch to a different monitoring tool, simply change the 'type' field.
 *
 * Environment Variables:
 * - APPINSIGHTS_INSTRUMENTATION_KEY: Your Application Insights instrumentation key
 * - LOGGING_TYPE: Logger type (applicationInsights, console, etc.)
 * - CLOUD_ROLE_NAME: Application name for Application Insights
 * - ENABLE_LIVE_METRICS: Enable live metrics streaming (true/false)
 * - ENABLE_DEBUG_LOGGING: Enable debug logs (true/false)
 */

module.exports = {
  // Logger type: 'applicationInsights', 'console'
  // Add more types as you implement them: 'datadog', 'newrelic', etc.
  type: process.env.LOGGING_TYPE || 'console', // Default to console to prevent crashes

  // Application Insights configuration
  // Prefer connection string (newer) over instrumentation key
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
  instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATION_KEY || '',

  // Cloud role name (shown in Application Insights)
  cloudRoleName: process.env.CLOUD_ROLE_NAME || 'CricketExpenseApp-Server',

  // Enable Application Insights Live Metrics Stream
  enableLiveMetrics: process.env.ENABLE_LIVE_METRICS === 'true',

  // Enable debug logging (for console logger)
  enableDebug: process.env.ENABLE_DEBUG_LOGGING !== 'false', // Default true

  // Log levels
  logLevel: process.env.LOG_LEVEL || 'info' // info, warn, error, debug
};