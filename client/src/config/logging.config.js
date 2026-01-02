/**
 * Client-Side Logging Configuration
 *
 * Configure your client-side logging implementation here.
 *
 * Environment Variables (create a .env file in client directory):
 * - REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY: Your Application Insights instrumentation key
 * - REACT_APP_CLOUD_ROLE_NAME: Application name for Application Insights
 */

const loggingConfig = {
  // Application Insights instrumentation key
  instrumentationKey: process.env.REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY || '',

  // Cloud role name (shown in Application Insights)
  cloudRoleName: process.env.REACT_APP_CLOUD_ROLE_NAME || 'CricketExpenseApp-Client',

  // Enable in production
  enabled: process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_LOGGING === 'true'
};

export default loggingConfig;