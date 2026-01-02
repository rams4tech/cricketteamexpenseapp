# Logging Quick Reference

Quick reference for using the logging framework in the Cricket Expense Management Application.

## Setup (One-Time)

### 1. Environment Variables

**Server** (`server/.env`):
```env
APPINSIGHTS_INSTRUMENTATION_KEY=your_key_here
LOGGING_TYPE=applicationInsights
```

**Client** (`client/.env`):
```env
REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY=your_key_here
```

## Server-Side Usage

### Get Logger Instance
```javascript
// Already initialized in server.js, access via:
// - req.correlationId is automatically available in all routes
// - logger is imported at top of server.js
```

### Basic Logging
```javascript
logger.info('Message', { key: 'value' }, req.correlationId);
logger.warn('Warning message', { key: 'value' }, req.correlationId);
logger.error('Error message', error, { key: 'value' }, req.correlationId);
logger.debug('Debug info', { key: 'value' }, req.correlationId);
```

### Track Events
```javascript
logger.trackEvent('EventName', { prop: 'value' }, { metric: 123 }, req.correlationId);
```

### Track Database Calls
```javascript
const startTime = Date.now();
db.query('SELECT...', (err, result) => {
  logger.trackDependency({
    type: 'SQL',
    target: 'database_name',
    name: 'Query description',
    data: 'SELECT...',
    duration: Date.now() - startTime,
    success: !err,
    resultCode: err ? 500 : 200
  }, req.correlationId);
});
```

## Client-Side Usage

### Page Tracking
```javascript
import usePageTracking from '../hooks/usePageTracking';

function MyPage() {
  usePageTracking('PageName');
  // ...
}
```

### Basic Logging
```javascript
import { getLogger } from '../services/logger';
const logger = getLogger();

logger.info('Message', { key: 'value' });
logger.warn('Warning', { key: 'value' });
logger.error('Error', error, { key: 'value' });
```

### Track User Actions
```javascript
// Track button click
logger.trackEvent('ButtonClicked', { buttonId: 'submit' });

// Track form submission
logger.trackEvent('FormSubmitted', { formName: 'CreatePlayer' });

// Track API success
logger.trackEvent('PlayerCreated', { playerId: id });
```

### Time Operations
```javascript
const stopTracking = logger.startTrackEvent('OperationName');
// ... do work ...
stopTracking({ status: 'success' }, { duration: ms });
```

## Configuration

### Switch to Console Logging (Development)

**Server** - `server/config/logging.config.js`:
```javascript
module.exports = {
  type: 'console',
  enableDebug: true
};
```

**Client** - `client/src/config/logging.config.js`:
```javascript
const loggingConfig = {
  instrumentationKey: '',
  enabled: false
};
```

## Common Patterns

### API Endpoint Logging
```javascript
app.post('/api/resource', async (req, res) => {
  try {
    // API calls are automatically logged by middleware
    const result = await createResource(req.body);

    // Track business event
    logger.trackEvent('ResourceCreated', {
      resourceId: result.id,
      userId: req.user.id
    }, {}, req.correlationId);

    res.json(result);
  } catch (error) {
    logger.error('Failed to create resource', error, {
      userId: req.user.id
    }, req.correlationId);
    res.status(500).json({ error: error.message });
  }
});
```

### React Component Logging
```javascript
import { getLogger } from '../services/logger';
import usePageTracking from '../hooks/usePageTracking';

const logger = getLogger();

function MyComponent() {
  usePageTracking('MyComponent');

  const handleAction = async () => {
    logger.trackEvent('ActionStarted', { action: 'submit' });

    try {
      await axios.post('/api/endpoint', data);
      logger.trackEvent('ActionCompleted', { action: 'submit' });
    } catch (error) {
      logger.error('Action failed', error, { action: 'submit' });
    }
  };

  return <div>...</div>;
}
```

## What's Automatically Logged

### Server
- ✅ All HTTP requests (method, URL, status, duration)
- ✅ User authentication (login/logout)
- ✅ Request/response timing
- ✅ Correlation IDs

### Client
- ✅ All API calls (method, URL, status, duration)
- ✅ User authentication (login/logout)
- ✅ React errors (via Error Boundary)
- ✅ Route changes (if enabled)
- ✅ Correlation IDs

## Viewing Logs

### Application Insights
1. Go to Azure Portal
2. Navigate to your Application Insights resource
3. Use these sections:
   - **Live Metrics**: Real-time logs
   - **Transaction Search**: Search specific requests
   - **Failures**: View errors
   - **Performance**: Analyze slow operations

### Sample Queries
```kusto
// Recent requests
requests | where timestamp > ago(1h)

// Find by correlation ID
traces | where customDimensions.correlationId == "your-id"

// Errors by user
exceptions | extend userId = tostring(customDimensions.userId)
```

## Don't Log These

❌ Passwords or authentication tokens
❌ Credit card numbers
❌ Personal identification numbers
❌ API keys or secrets
❌ Full request/response bodies (unless necessary)

## Do Log These

✅ User IDs (not usernames with PII)
✅ Request/response status codes
✅ Operation durations
✅ Business events (created, updated, deleted)
✅ Error messages and stack traces
✅ Correlation IDs

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Logs not appearing | Wait 2-3 minutes, check instrumentation key |
| No correlation IDs | Verify axios interceptor is setup in App.js |
| Too many logs | Set `ENABLE_DEBUG_LOGGING=false` |
| Console logging not working | Set `type: 'console'` in config |

## File Locations

```
Server:
  - server/logger/              - Logger implementations
  - server/middleware/loggingMiddleware.js
  - server/config/logging.config.js

Client:
  - client/src/services/logger.js
  - client/src/services/axiosInterceptor.js
  - client/src/components/ErrorBoundary.js
  - client/src/hooks/usePageTracking.js
  - client/src/config/logging.config.js
```

---

For detailed information, see [LOGGING_GUIDE.md](./LOGGING_GUIDE.md)