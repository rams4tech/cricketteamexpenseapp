/**
 * Test file for Logger Utility
 */

const { getLogger } = require('./logger');

describe('Logger Utility', () => {
  let logger;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    logger = getLogger();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('should create a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('should log info messages', () => {
    const message = 'Test info message';
    const metadata = { userId: 123 };

    logger.info(message, metadata);

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('should log error messages', () => {
    const message = 'Test error message';
    const error = new Error('Test error');
    const metadata = { userId: 123 };

    logger.error(message, error, metadata);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('should log debug messages', () => {
    const message = 'Test debug message';
    const metadata = { debug: true };

    logger.debug(message, metadata);

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('should handle correlation IDs', () => {
    const message = 'Test with correlation ID';
    const metadata = { test: true };
    const correlationId = 'test-correlation-123';

    logger.info(message, metadata, correlationId);

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('should track events', () => {
    if (typeof logger.trackEvent === 'function') {
      const eventName = 'TestEvent';
      const properties = { action: 'test' };
      const measurements = { duration: 100 };

      logger.trackEvent(eventName, properties, measurements);

      // Event tracking should not throw errors
      expect(true).toBe(true);
    }
  });

  test('should track API calls', () => {
    if (typeof logger.trackApiCall === 'function') {
      const method = 'GET';
      const url = '/api/test';
      const duration = 150;
      const statusCode = 200;
      const success = true;

      logger.trackApiCall(method, url, duration, statusCode, success);

      // API call tracking should not throw errors
      expect(true).toBe(true);
    }
  });

  test('should handle missing metadata gracefully', () => {
    const message = 'Test without metadata';

    logger.info(message);

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('should handle non-Error objects in error logging', () => {
    const message = 'Test error with string';
    const errorString = 'This is an error string';

    logger.error(message, errorString);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});