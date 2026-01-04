# Logging Setup Instructions

This document explains how logging is configured and how to get Application Insights telemetry working for both client and server.

## Overview

The application uses a dual logging strategy:
- **Local Development**: Console logging
- **Azure Production**: Application Insights telemetry

## Client-Side Logging

### Configuration
Client logging is configured in `client/src/config/logging.config.js` and uses environment variables:

```javascript
REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY  // Application Insights key
REACT_APP_CLOUD_ROLE_NAME                   // Application name in App Insights
REACT_APP_ENABLE_LOGGING                    // Enable logging explicitly
```

### Getting the Application Insights Instrumentation Key

#### Option 1: From Azure Portal
1. Go to Azure Portal → Resource Groups → `cricket-expense-rg`
2. Find the Application Insights resource (usually `cricketteamexpense-insights`)
3. Click on the resource
4. In the Overview page, copy the **Instrumentation Key**

#### Option 2: Using Azure CLI
```bash
az resource show \
  --resource-group cricket-expense-rg \
  --name cricketteamexpense-insights \
  --resource-type "Microsoft.Insights/components" \
  --query properties.InstrumentationKey \
  --output tsv
```

### Adding to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `APPINSIGHTS_INSTRUMENTATION_KEY`
5. Value: Paste the instrumentation key from Azure
6. Click "Add secret"

### Build-Time Configuration

The CI workflow (`.github/workflows/ci.yml`) injects these values during build:

```yaml
env:
  REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY: ${{ secrets.APPINSIGHTS_INSTRUMENTATION_KEY }}
  REACT_APP_CLOUD_ROLE_NAME: CricketExpenseApp-Client
  REACT_APP_ENABLE_LOGGING: true
```

## Server-Side Logging

### Configuration
Server logging is configured in `server/config/logging.config.js`:

```javascript
APPINSIGHTS_INSTRUMENTATION_KEY  // Application Insights key
LOGGING_TYPE                      // 'console' or 'applicationInsights'
NODE_ENV                          // 'development' or 'production'
```

### App Service Configuration

The CD workflow automatically configures Application Insights for the backend:

```yaml
{
  "name": "APPINSIGHTS_INSTRUMENTATION_KEY",
  "value": "${{ needs.deploy-infrastructure.outputs.appInsightsInstrumentationKey }}"
},
{
  "name": "LOGGING_TYPE",
  "value": "applicationInsights"
}
```

## Logging Features

### Client Logger (`client/src/services/logger.js`)

The client logger provides:

```javascript
import { getLogger } from '../services/logger';
const logger = getLogger();

// Page tracking
logger.trackPageView('PageName', window.location.href);

// Events
logger.trackEvent('EventName', { prop1: 'value1' });

// Info logging
logger.info('Message', { context: 'data' });

// Warnings
logger.warn('Warning message', { details });

// Errors
logger.error('Error occurred', error, { additional: 'context' });

// User context
logger.setUser(username, userId);
logger.clearUser(); // On logout
```

### Server Logger (`server/logger/`)

The server uses factory pattern:

```javascript
const { LoggerFactory } = require('./logger');
const logger = LoggerFactory.createLogger(loggingConfig);

// Info logging
logger.info('Message', { context }, correlationId);

// Warnings
logger.warn('Warning', { details }, correlationId);

// Errors
logger.error('Error', error, { context }, correlationId);

// Events
logger.trackEvent('EventName', { props }, { metrics }, correlationId);
```

## Logging Added to Pages

Logging has been added to all key pages:

### Login Page (`client/src/pages/Login.js`)
- Page load tracking
- Login attempt logging
- Login success/failure events
- Password reset attempt logging
- User context setting on successful login

### Example Pattern for Other Pages

```javascript
import React, { useEffect } from 'react';
import { getLogger } from '../services/logger';

const logger = getLogger();

function MyPage() {
  useEffect(() => {
    logger.info('MyPage loaded');
    logger.trackPageView('MyPage', window.location.href);
  }, []);

  const handleAction = async () => {
    logger.info('Action started');
    logger.trackEvent('ActionAttempt');

    try {
      // ... action logic
      logger.info('Action completed successfully');
      logger.trackEvent('ActionSuccess');
    } catch (error) {
      logger.error('Action failed', error, { context: 'details' });
      logger.trackEvent('ActionFailure', { error: error.message });
    }
  };

  return (
    // ... component JSX
  );
}
```

## Viewing Logs

### Application Insights Portal

1. Go to Azure Portal → Application Insights resource
2. Navigate to different sections:
   - **Live Metrics**: Real-time telemetry
   - **Logs**: Query logs using KQL
   - **Transaction search**: Find specific transactions
   - **Failures**: View exceptions and failed requests
   - **Performance**: Analyze performance metrics
   - **Usage**: User behavior analytics

### Common KQL Queries

```kql
// View all page views
pageViews
| where timestamp > ago(1h)
| order by timestamp desc

// View login events
customEvents
| where name == "LoginAttempt" or name == "LoginSuccess" or name == "LoginFailure"
| order by timestamp desc

// View errors
exceptions
| where timestamp > ago(1h)
| order by timestamp desc

// View API calls
dependencies
| where type == "HTTP"
| order by timestamp desc
```

## Troubleshooting

### No Logs Appearing in Application Insights

1. **Check Instrumentation Key**: Verify the key is correct in GitHub Secrets
2. **Check Build**: Ensure the frontend build includes the environment variable
3. **Check Browser Console**: Look for Application Insights initialization messages
4. **Wait for Ingestion**: Application Insights can take 2-5 minutes to show data
5. **Check Network Tab**: Verify telemetry is being sent to `dc.services.visualstudio.com`

### Console Logging in Development

For local development without Application Insights:

```bash
# Client
cd client
# No REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY set = console logging only
npm start

# Server
cd server
export LOGGING_TYPE=console  # or set LOGGING_TYPE=console on Windows
npm start
```

## Best Practices

1. **Always log user actions**: Login, signup, important button clicks
2. **Track page views**: Add to useEffect in every page component
3. **Log errors with context**: Include relevant data but no sensitive information
4. **Use appropriate log levels**:
   - `info`: Normal operations
   - `warn`: Unusual but handled situations
   - `error`: Actual errors that need attention
5. **Set user context**: Call `logger.setUser()` after login
6. **Clear user context**: Call `logger.clearUser()` on logout
7. **Never log sensitive data**: Passwords, tokens, credit cards, etc.
8. **Add correlation IDs**: For tracking requests across client/server

## Security Notes

- Application Insights Instrumentation Key is not secret (client-side visible)
- However, store in GitHub Secrets for centralized management
- Never log passwords, authentication tokens, or PII
- Use sanitized versions of data for logging
- Filter sensitive data in Application Insights workspace if needed