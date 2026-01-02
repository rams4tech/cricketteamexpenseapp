/**
 * Environment Configuration
 *
 * Determines whether the application is running in local or production environment
 * and provides appropriate database and application settings.
 */

const config = {
  // Environment: 'local' or 'production'
  environment: process.env.NODE_ENV || 'local',

  // Server configuration
  port: process.env.PORT || 5000,

  // JWT Secret
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',

  // Database configuration
  database: {
    type: process.env.DB_TYPE || 'sqlite', // 'sqlite' or 'mssql'

    // SQLite configuration (local development)
    sqlite: {
      filename: process.env.SQLITE_FILE || './cricket_expenses.db'
    },

    // Azure SQL configuration (production)
    azureSQL: {
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      user: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD,
      options: {
        encrypt: true, // Required for Azure
        trustServerCertificate: false,
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    }
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGS !== 'false'
  }
};

// Validation for production environment
if (config.environment === 'production') {
  if (config.database.type === 'mssql') {
    const required = ['server', 'database', 'user', 'password'];
    const missing = required.filter(field => !config.database.azureSQL[field]);

    if (missing.length > 0) {
      console.error(`Missing required Azure SQL configuration: ${missing.join(', ')}`);
      console.error('Please set the following environment variables:');
      console.error('- AZURE_SQL_SERVER');
      console.error('- AZURE_SQL_DATABASE');
      console.error('- AZURE_SQL_USER');
      console.error('- AZURE_SQL_PASSWORD');
      process.exit(1);
    }
  }

  if (config.jwtSecret === 'your-secret-key-change-in-production') {
    console.warn('WARNING: Using default JWT secret in production. Please set JWT_SECRET environment variable.');
  }
}

// Helper functions
config.isProduction = () => config.environment === 'production';
config.isLocal = () => config.environment === 'local';
config.useSQLite = () => config.database.type === 'sqlite';
config.useAzureSQL = () => config.database.type === 'mssql';

module.exports = config;
