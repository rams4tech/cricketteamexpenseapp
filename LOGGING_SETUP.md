# Logging Framework - Setup Instructions

This document provides step-by-step instructions to get the logging framework up and running.

## Prerequisites

✅ All dependencies have been installed
✅ Logging code has been implemented
✅ You need an Azure Application Insights resource (or can use console logging)

## Quick Start (5 Minutes)

### Option A: With Application Insights (Recommended for Production)

#### Step 1: Get Your Instrumentation Key

1. Go to [Azure Portal](https://portal.azure.com)
2. Create or open your Application Insights resource
3. Copy the **Instrumentation Key** from Overview → Essentials

#### Step 2: Configure Server

Create `server/.env` file (if it doesn't exist):

```env
# Application Insights
APPINSIGHTS_INSTRUMENTATION_KEY=paste_your_key_here
LOGGING_TYPE=applicationInsights
CLOUD_ROLE_NAME=CricketExpenseApp-Server

# Other required settings
PORT=5000
JWT_SECRET=your_secret_key_change_in_production
NODE_ENV=development
```

#### Step 3: Configure Client

Create `client/.env` file (if it doesn't exist):

```env
# Application Insights
REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY=paste_your_key_here
REACT_APP_CLOUD_ROLE_NAME=CricketExpenseApp-Client
```

#### Step 4: Start the Application

```bash
# Terminal 1 - Start server
cd server
npm start

# Terminal 2 - Start client
cd client
npm start
```

#### Step 5: Verify Logging Works

1. Open the app at http://localhost:3000
2. Log in or perform some actions
3. Wait 2-3 minutes
4. Check Azure Portal → Application Insights → Transaction Search
5. You should see requests, traces, and events

✅ **Done!** Your application is now logging to Application Insights.

---

### Option B: Console Logging (Development/Testing)

If you don't want to use Application Insights yet, you can use console logging:

#### Step 1: Configure Server

Edit `server/config/logging.config.js`:

```javascript
module.exports = {
  type: 'console',  // Changed from 'applicationInsights'
  enableDebug: true,
  logLevel: 'info'
};
```

#### Step 2: Configure Client

Edit `client/src/config/logging.config.js`:

```javascript
const loggingConfig = {
  instrumentationKey: '',  // Leave empty
  cloudRoleName: 'CricketExpenseApp-Client',
  enabled: false  // Disable Application Insights
};

export default loggingConfig;
```

#### Step 3: Start the Application

```bash
# Terminal 1 - Start server
cd server
npm start

# Terminal 2 - Start client
cd client
npm start
```

#### Step 4: View Logs

- **Server logs**: Check Terminal 1
- **Client logs**: Check browser console (F12 → Console tab)

✅ **Done!** Logs are now printed to the console.

---

## What's Been Implemented

### Server-Side ✅

- [x] Abstract logger interface for tool-agnostic logging
- [x] Application Insights logger implementation
- [x] Console logger fallback
- [x] Logger factory for easy switching
- [x] Request/response logging middleware
- [x] Correlation ID tracking
- [x] Error logging middleware
- [x] Database dependency tracking support
- [x] Configuration management

### Client-Side ✅

- [x] Application Insights web SDK integration
- [x] Axios interceptor for API logging
- [x] Correlation ID propagation
- [x] Error boundary for React errors
- [x] Page tracking hook
- [x] User context tracking
- [x] Custom event tracking
- [x] Configuration management

### Features ✅

- [x] End-to-end request tracing with correlation IDs
- [x] Automatic HTTP request/response logging
- [x] User authentication event tracking
- [x] Error and exception tracking
- [x] Custom business event tracking
- [x] Performance monitoring
- [x] Tool-agnostic architecture (easy to switch to Datadog, New Relic, etc.)

---

## File Structure

```
cricketexpenseapp/
├── server/
│   ├── logger/
│   │   ├── ILogger.js                      # Abstract interface
│   │   ├── ApplicationInsightsLogger.js    # AI implementation
│   │   ├── ConsoleLogger.js                # Console implementation
│   │   ├── LoggerFactory.js                # Factory pattern
│   │   └── index.js                        # Exports
│   ├── middleware/
│   │   └── loggingMiddleware.js            # Express middleware
│   ├── config/
│   │   └── logging.config.js               # Server config
│   └── server.js                           # Logger initialized here
│
├── client/src/
│   ├── services/
│   │   ├── logger.js                       # Client logger
│   │   └── axiosInterceptor.js             # API interceptor
│   ├── components/
│   │   └── ErrorBoundary.js                # Error boundary
│   ├── hooks/
│   │   └── usePageTracking.js              # Page tracking hook
│   ├── config/
│   │   └── logging.config.js               # Client config
│   ├── context/
│   │   └── AuthContext.js                  # Updated with logging
│   └── App.js                              # Logger initialized here
│
├── LOGGING_GUIDE.md                         # Comprehensive guide
├── LOGGING_QUICK_REFERENCE.md               # Quick reference
└── LOGGING_SETUP.md                         # This file
```

---

## Usage Examples

### Server Example

The middleware automatically logs all requests. For custom logging:

```javascript
// In any route handler
app.post('/api/players', (req, res) => {
  logger.info('Creating new player', {
    userId: req.user.id,
    playerName: req.body.firstname
  }, req.correlationId);

  // ... your code ...

  logger.trackEvent('PlayerCreated', {
    playerId: newPlayer.id
  }, {}, req.correlationId);
});
```

### Client Example

```javascript
import { getLogger } from '../services/logger';
import usePageTracking from '../hooks/usePageTracking';

const logger = getLogger();

function MyComponent() {
  // Automatically track page views
  usePageTracking('MyComponent');

  const handleClick = () => {
    // Track user actions
    logger.trackEvent('ButtonClicked', {
      buttonId: 'submit'
    });
  };

  // API calls are automatically logged by axios interceptor
  // Errors are automatically caught by Error Boundary

  return <div>...</div>;
}
```

---

## Next Steps

1. **Add Logging to Your Pages**:
   - Import `usePageTracking` hook
   - Import `getLogger` for custom events
   - See [Contributions.js](client/src/pages/Contributions.js) for example

2. **Customize Logging**:
   - Add business-specific events
   - Track important metrics
   - Monitor performance bottlenecks

3. **Set Up Alerts** (Application Insights):
   - Navigate to Azure Portal → Alerts
   - Create alerts for errors, slow requests, etc.

4. **Create Dashboards**:
   - Use Application Insights Workbooks
   - Create custom KQL queries
   - Monitor key metrics

---

## Testing the Logging

### Test Checklist

- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Login action is logged
- [ ] Page views are tracked
- [ ] API calls show correlation IDs in network tab
- [ ] Errors are caught and logged
- [ ] Business events appear in Application Insights (or console)

### Manual Test

1. Start the application
2. Open browser DevTools (F12)
3. Go to Network tab
4. Log in to the application
5. Check request headers for `x-correlation-id`
6. Check response headers for `x-correlation-id`
7. Navigate to different pages
8. Create/edit/delete some data
9. Check console for log messages
10. After 2-3 minutes, check Application Insights

---

## Troubleshooting

### "Logger not initialized" Error

**Solution**: Make sure the logger is initialized before use. Check that `initializeLogger()` is called in `App.js` (client) and at the top of `server.js` (server).

### Logs Not Appearing in Application Insights

**Possible causes**:
1. Incorrect instrumentation key
2. Network connectivity issues
3. Telemetry hasn't propagated yet (wait 2-3 minutes)

**Solution**:
- Verify instrumentation key
- Check browser/server console for errors
- Wait a few minutes and refresh Application Insights

### High Number of Logs

**Solution**:
- Set `ENABLE_DEBUG_LOGGING=false` in server/.env
- Reduce custom event tracking
- Configure sampling in Application Insights

### CORS Errors with Application Insights

**Solution**: The SDK should handle this automatically. If issues persist:
- Check `enableCorsCorrelation` is set to `true` in logger configuration
- Verify Azure endpoint is reachable

---

## Support & Documentation

- **Comprehensive Guide**: [LOGGING_GUIDE.md](./LOGGING_GUIDE.md)
- **Quick Reference**: [LOGGING_QUICK_REFERENCE.md](./LOGGING_QUICK_REFERENCE.md)
- **Azure Documentation**: [Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

---

## Summary

✅ **Logging framework is fully implemented and ready to use!**

**What you need to do**:
1. Get Application Insights instrumentation key (or use console logging)
2. Add keys to `.env` files
3. Start the application
4. Verify logging works

**Benefits**:
- End-to-end request tracing
- Automatic error tracking
- Performance monitoring
- Easy to switch monitoring tools
- Production-ready logging

---

**Last Updated**: 2026-01-02
**Status**: ✅ Complete and Ready for Use