const { v4: uuidv4 } = require('uuid');

/**
 * Request Logging and Correlation Middleware
 *
 * This middleware:
 * 1. Generates a unique correlation ID for each request
 * 2. Adds the correlation ID to request and response headers
 * 3. Tracks request duration and logs request details
 * 4. Enables end-to-end request tracing across client and server
 */

/**
 * Creates logging middleware with the provided logger instance
 * @param {ILogger} logger - Logger instance
 * @returns {Function} Express middleware function
 */
function createLoggingMiddleware(logger) {
  return (req, res, next) => {
    // Generate or use existing correlation ID
    const correlationId = req.headers['x-correlation-id'] || uuidv4();

    // Attach correlation ID to request object for use in route handlers
    req.correlationId = correlationId;

    // Add correlation ID to response headers for client to track
    res.setHeader('x-correlation-id', correlationId);

    // Record request start time
    const startTime = Date.now();

    // Extract user info if available (set by authenticateToken middleware)
    const userId = req.user?.id || 'anonymous';
    const userRole = req.user?.role || 'anonymous';

    // Log incoming request
    logger.info(`Incoming request: ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      userId,
      userRole,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    }, correlationId);

    // Capture the original res.json and res.send to log after response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Wrapper for res.json
    res.json = function (body) {
      res.json = originalJson; // Restore original
      logResponse();
      return res.json(body);
    };

    // Wrapper for res.send
    res.send = function (body) {
      res.send = originalSend; // Restore original
      logResponse();
      return res.send(body);
    };

    // Log response details
    function logResponse() {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;

      // Track the request in Application Insights
      logger.trackRequest({
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode,
        success,
        userId,
        userRole,
        properties: {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      }, correlationId);

      // Log based on status code
      if (success) {
        logger.info(`Request completed: ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`, {
          method: req.method,
          url: req.originalUrl,
          statusCode,
          duration,
          userId,
          userRole
        }, correlationId);
      } else {
        logger.warn(`Request failed: ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`, {
          method: req.method,
          url: req.originalUrl,
          statusCode,
          duration,
          userId,
          userRole
        }, correlationId);
      }
    }

    // Handle errors in the response
    res.on('finish', () => {
      // Response already sent, this is a fallback in case json/send weren't called
      if (!res.headersSent) {
        logResponse();
      }
    });

    next();
  };
}

/**
 * Error logging middleware
 * Should be added after all routes to catch any unhandled errors
 */
function createErrorLoggingMiddleware(logger) {
  return (err, req, res, next) => {
    const correlationId = req.correlationId || 'unknown';

    // Log the error
    logger.error(`Unhandled error in ${req.method} ${req.originalUrl}`, err, {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'anonymous',
      statusCode: err.statusCode || 500,
      errorCode: err.code,
      errorMessage: err.message
    }, correlationId);

    // Track error event
    logger.trackEvent('UnhandledError', {
      method: req.method,
      url: req.originalUrl,
      errorMessage: err.message,
      errorStack: err.stack
    }, {}, correlationId);

    // Send error response
    res.status(err.statusCode || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      correlationId
    });
  };
}

module.exports = {
  createLoggingMiddleware,
  createErrorLoggingMiddleware
};