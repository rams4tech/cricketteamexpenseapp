# Logging Framework Guide

This document provides comprehensive information about the logging framework implemented in the Cricket Expense Management Application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Configuration](#configuration)
5. [Using the Logger](#using-the-logger)
6. [End-to-End Request Tracing](#end-to-end-request-tracing)
7. [Switching Monitoring Tools](#switching-monitoring-tools)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The application includes a comprehensive logging framework with the following features:

- **Tool-Agnostic Design**: Easily switch between monitoring tools (Application Insights, Datadog, New Relic, etc.)
- **End-to-End Tracing**: Track requests from client to server using correlation IDs
- **Automatic Request Logging**: All HTTP requests are automatically logged with timing information
- **Error Tracking**: Automatic error capture on both client and server
- **Custom Events & Metrics**: Track business-specific events and metrics
- **User Context**: Associate logs with authenticated users
- **Performance Monitoring**: Track API call durations and database operations

---

## Architecture

### Server-Side Architecture

```
server/
├── logger/
│   ├── ILogger.js                      # Abstract logger interface
│   ├── ApplicationInsightsLogger.js    # Application Insights implementation
│   ├── ConsoleLogger.js                # Console logger (fallback/development)
│   ├── LoggerFactory.js                # Factory for creating logger instances
│   └── index.js                        # Module exports
├── middleware/
│   └── loggingMiddleware.js            # Request/response logging middleware
└── config/
    └── logging.config.js               # Server logging configuration
```

### Client-Side Architecture

```
client/src/
├── services/
│   ├── logger.js                       # Client-side logger
│   └── axiosInterceptor.js             # Axios interceptor for API logging
├── components/
│   └── ErrorBoundary.js                # React error boundary with logging
├── hooks/
│   └── usePageTracking.js              # Custom hook for page tracking
└── config/
    └── logging.config.js               # Client logging configuration
```

---

## Setup Instructions

### 1. Prerequisites

The logging dependencies have already been installed:

**Server:**
- `applicationinsights` - Azure Application Insights SDK
- `uuid` - For generating correlation IDs

**Client:**
- `@microsoft/applicationinsights-web` - Application Insights for web
- `uuid` - For generating correlation IDs

### 2. Get Application Insights Instrumentation Key

1. Go to [Azure Portal](https://portal.azure.com)
2. Create or navigate to your Application Insights resource
3. Copy the **Instrumentation Key** from the Overview page

### 3. Configure Environment Variables

#### Server Configuration

Create or update `server/.env`:

```env
# Application Insights Configuration
APPINSIGHTS_INSTRUMENTATION_KEY=your_instrumentation_key_here
LOGGING_TYPE=applicationInsights
CLOUD_ROLE_NAME=CricketExpenseApp-Server
ENABLE_LIVE_METRICS=false
ENABLE_DEBUG_LOGGING=true
LOG_LEVEL=info

# Other settings
NODE_ENV=production
PORT=5000
JWT_SECRET=your_secret_key_here
```

#### Client Configuration

Create or update `client/.env`:

```env
# Application Insights Configuration
REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY=your_instrumentation_key_here
REACT_APP_CLOUD_ROLE_NAME=CricketExpenseApp-Client
REACT_APP_ENABLE_LOGGING=true
```

### 4. Start the Application

```bash
# Server
cd server
npm start

# Client (in a separate terminal)
cd client
npm start
```

---

## Configuration

### Server Configuration Options

Edit `server/config/logging.config.js`:

| Option | Description | Default |
|--------|-------------|---------|
| `type` | Logger type: 'applicationInsights', 'console' | 'applicationInsights' |
| `instrumentationKey` | Application Insights key | '' |
| `cloudRoleName` | Application name in Azure | 'CricketExpenseApp-Server' |
| `enableLiveMetrics` | Enable live metrics stream | false |
| `enableDebug` | Enable debug logging | true |
| `logLevel` | Minimum log level | 'info' |

### Client Configuration Options

Edit `client/src/config/logging.config.js`:

| Option | Description | Default |
|--------|-------------|---------|
| `instrumentationKey` | Application Insights key | '' |
| `cloudRoleName` | Application name in Azure | 'CricketExpenseApp-Client' |
| `enabled` | Enable logging | production mode only |

---

## Using the Logger

### Server-Side Logging

The logger is automatically initialized in `server.js` and available throughout the application.

#### Basic Logging

```javascript
const { getLogger } = require('./logger');
const logger = getLogger(); // Uses the singleton instance from server.js

// Information
logger.info('User action completed', {
  userId: user.id,
  action: 'create_player'
}, req.correlationId);

// Warning
logger.warn('API rate limit approaching', {
  userId: user.id,
  requestCount: 95
}, req.correlationId);

// Error
logger.error('Database query failed', error, {
  query: 'SELECT * FROM players',
  userId: user.id
}, req.correlationId);

// Debug
logger.debug('Processing request', {
  method: req.method,
  url: req.url
}, req.correlationId);
```

#### Track Custom Events

```javascript
logger.trackEvent('PlayerCreated', {
  playerId: player.id,
  createdBy: user.id
}, {
  count: 1
}, req.correlationId);
```

#### Track Metrics

```javascript
logger.trackMetric('ActiveUsers', activeUserCount, {
  timestamp: new Date()
}, req.correlationId);
```

#### Track Dependencies (Database, External APIs)

```javascript
const startTime = Date.now();

db.query('SELECT * FROM players', (err, result) => {
  const duration = Date.now() - startTime;

  logger.trackDependency({
    type: 'SQL',
    target: 'cricket_expenses.db',
    name: 'SELECT players',
    data: 'SELECT * FROM players',
    duration,
    success: !err,
    resultCode: err ? 500 : 200
  }, req.correlationId);
});
```

### Client-Side Logging

#### Import the Logger

```javascript
import { getLogger } from '../services/logger';
const logger = getLogger();
```

#### Page Tracking

Use the custom hook for automatic page view tracking:

```javascript
import usePageTracking from '../hooks/usePageTracking';

function MyPage() {
  usePageTracking('MyPage', { section: 'admin' });

  // Your component code...
}
```

#### Track User Actions

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  // Track form submission
  logger.trackEvent('FormSubmitted', {
    formName: 'CreatePlayer',
    fieldCount: 5
  });

  try {
    await axios.post('/api/players', formData);

    // Track success
    logger.trackEvent('PlayerCreated', {
      playerId: response.data.id
    });
  } catch (error) {
    // Errors are automatically logged by axios interceptor
    logger.error('Form submission failed', error, {
      formName: 'CreatePlayer'
    });
  }
};
```

#### Track Button Clicks

```javascript
const handleDeleteClick = (id) => {
  logger.trackEvent('DeleteButtonClicked', {
    entityType: 'player',
    entityId: id
  });

  // Your delete logic...
};
```

#### Time Operations

```javascript
const stopTracking = logger.startTrackEvent('DataProcessing');

// ... do some processing ...

stopTracking({
  recordCount: data.length,
  success: true
}, {
  processingTimeMs: duration
});
```

---

## End-to-End Request Tracing

The framework implements correlation IDs to trace requests across client and server.

### How It Works

1. **Client Generates Correlation ID**: When making an API request, the axios interceptor generates a unique correlation ID
2. **ID Sent to Server**: The correlation ID is sent in the `x-correlation-id` header
3. **Server Logs with ID**: All server logs include the correlation ID
4. **ID Returned to Client**: The server echoes the correlation ID back in the response
5. **Client Tracks Response**: The client logs the response with both IDs for verification

### Viewing Traces in Application Insights

In Azure Portal → Application Insights → Transaction Search:

1. Search for a specific correlation ID
2. See all related logs from client and server
3. View the complete request flow timeline
4. Analyze performance bottlenecks

Example Query:

```kusto
traces
| union requests
| union dependencies
| where customDimensions.correlationId == "your-correlation-id-here"
| order by timestamp asc
```

---

## Switching Monitoring Tools

The logging framework is designed to be tool-agnostic. Here's how to switch to a different monitoring solution:

### Option 1: Switch to Console Logging (Development/Testing)

**Server:** Edit `server/config/logging.config.js`:

```javascript
module.exports = {
  type: 'console',  // Change from 'applicationInsights' to 'console'
  enableDebug: true
};
```

**Client:** Edit `client/src/config/logging.config.js`:

```javascript
const loggingConfig = {
  instrumentationKey: '',  // Leave empty
  enabled: false  // Disable Application Insights
};
```

### Option 2: Implement a New Logger (e.g., Datadog)

1. **Create Logger Implementation**

Create `server/logger/DatadogLogger.js`:

```javascript
const ILogger = require('./ILogger');
// Import Datadog SDK
const tracer = require('dd-trace').init();

class DatadogLogger extends ILogger {
  constructor(config) {
    super();
    this.config = config;
    // Initialize Datadog
  }

  info(message, properties = {}, correlationId = null) {
    // Implement using Datadog SDK
  }

  error(message, error = null, properties = {}, correlationId = null) {
    // Implement using Datadog SDK
  }

  // Implement other methods...
}

module.exports = DatadogLogger;
```

2. **Update Logger Factory**

Edit `server/logger/LoggerFactory.js`:

```javascript
const DatadogLogger = require('./DatadogLogger');

// Add to switch statement
case 'datadog':
  return new DatadogLogger(config);
```

3. **Update Configuration**

Edit `server/config/logging.config.js`:

```javascript
module.exports = {
  type: 'datadog',
  apiKey: process.env.DATADOG_API_KEY,
  cloudRoleName: 'CricketExpenseApp-Server'
};
```

### Option 3: New Relic, Splunk, or Other Tools

Follow the same pattern as Option 2:

1. Create a new logger class that implements `ILogger`
2. Add it to `LoggerFactory`
3. Update configuration
4. Install the appropriate SDK

---

## Best Practices

### 1. Always Include Context

```javascript
// ❌ Bad
logger.info('Player created');

// ✅ Good
logger.info('Player created', {
  playerId: player.id,
  createdBy: user.id,
  timestamp: new Date()
}, req.correlationId);
```

### 2. Use Appropriate Log Levels

- **info**: Normal operations, successful actions
- **warn**: Unusual but handled situations
- **error**: Failures that need attention
- **debug**: Detailed debugging information (disabled in production)

### 3. Don't Log Sensitive Data

```javascript
// ❌ Bad - Logs password
logger.info('User login attempt', {
  username: user.username,
  password: plainPassword  // Never log passwords!
});

// ✅ Good
logger.info('User login attempt', {
  username: user.username,
  hasPassword: !!plainPassword
});
```

### 4. Track Business Metrics

```javascript
// Track important business events
logger.trackEvent('MatchCompleted', {
  teamId: match.team_id,
  totalExpense: match.total_expense,
  playersCount: match.players_count
}, {
  expensePerPlayer: match.expense_per_player
});
```

### 5. Use Error Boundary on Client

The `ErrorBoundary` component is already set up in the app. Wrap critical sections:

```javascript
<ErrorBoundary name="CriticalFeature">
  <YourComponent />
</ErrorBoundary>
```

---

## Troubleshooting

### Logs Not Appearing in Application Insights

1. **Check Instrumentation Key**: Verify the key is correct in `.env` files
2. **Check Network**: Ensure the application can reach Azure endpoints
3. **Wait**: It can take 2-3 minutes for logs to appear initially
4. **Check Console**: Look for initialization messages or errors

### Correlation IDs Not Working

1. **Check Axios Interceptor**: Verify it's initialized in `App.js`
2. **Check Headers**: Use browser DevTools Network tab to verify `x-correlation-id` header is sent
3. **Check Server Middleware**: Ensure `loggingMiddleware` is added before routes

### High Telemetry Costs

1. **Reduce Sampling**: Configure sampling in Application Insights
2. **Filter Debug Logs**: Set `ENABLE_DEBUG_LOGGING=false` in production
3. **Optimize Tracking**: Only track essential events and metrics

### Console Logger Not Working

1. **Check Configuration**: Verify `type: 'console'` in config
2. **Check Console**: Open browser/Node.js console to see logs
3. **Enable Debug**: Set `enableDebug: true` for more details

---

## Viewing Logs in Application Insights

### Navigate to Azure Portal

1. Go to your Application Insights resource
2. Use these features:

**Live Metrics**: Real-time telemetry stream
- Overview → Live Metrics

**Transaction Search**: Find specific requests/errors
- Investigate → Transaction search

**Application Map**: Visualize dependencies
- Investigate → Application map

**Performance**: Analyze slow operations
- Investigate → Performance

**Failures**: View errors and exceptions
- Investigate → Failures

### Sample Queries

**View All Requests from Last Hour**:
```kusto
requests
| where timestamp > ago(1h)
| order by timestamp desc
```

**Find Slow API Calls**:
```kusto
requests
| where duration > 1000
| order by duration desc
```

**View Errors by User**:
```kusto
exceptions
| extend userId = tostring(customDimensions.userId)
| summarize count() by userId
| order by count_ desc
```

**Track End-to-End Request**:
```kusto
let corrId = "your-correlation-id";
union requests, traces, dependencies, exceptions
| where customDimensions.correlationId == corrId
| order by timestamp asc
| project timestamp, itemType, message, name, duration
```

---

## Additional Resources

- [Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Kusto Query Language (KQL) Reference](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [Express.js Logging Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)

---

## Support

For issues or questions about the logging implementation:

1. Check this documentation first
2. Review the code comments in logger files
3. Check Application Insights documentation
4. Contact the development team

---

**Last Updated**: 2026-01-02
**Version**: 1.0