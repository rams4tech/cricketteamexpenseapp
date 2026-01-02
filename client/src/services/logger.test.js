/**
 * Test file for Client Logger Service
 */

import { getLogger } from './logger';

describe('Client Logger Service', () => {
  let logger;
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    logger = getLogger();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('should create a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('should log info messages', () => {
    const message = 'Test info message';
    const metadata = { component: 'TestComponent' };

    logger.info(message, metadata);

    // Verify console.log was called
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('should log error messages', () => {
    const message = 'Test error message';
    const error = new Error('Test error');
    const metadata = { component: 'TestComponent' };

    logger.error(message, error, metadata);

    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('should log debug messages in development', () => {
    const message = 'Test debug message';
    const metadata = { debug: true };

    logger.debug(message, metadata);

    // Debug logs should call console.log
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('should track events if Application Insights is available', () => {
    if (typeof logger.trackEvent === 'function') {
      const eventName = 'ButtonClick';
      const properties = { buttonId: 'submit' };
      const measurements = { clickCount: 1 };

      // Should not throw
      expect(() => {
        logger.trackEvent(eventName, properties, measurements);
      }).not.toThrow();
    }
  });

  test('should track API calls with correlation tracking', () => {
    if (typeof logger.trackApiCall === 'function') {
      const method = 'GET';
      const url = '/api/players';
      const duration = 250;
      const statusCode = 200;
      const success = true;
      const additionalData = { correlationId: 'test-123' };

      // Should not throw
      expect(() => {
        logger.trackApiCall(method, url, duration, statusCode, success, additionalData);
      }).not.toThrow();
    }
  });

  test('should handle missing metadata', () => {
    const message = 'Test without metadata';

    // Should not throw
    expect(() => {
      logger.info(message);
    }).not.toThrow();

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test('should format error objects correctly', () => {
    const message = 'Error occurred';
    const error = new Error('Test error');
    error.stack = 'Error stack trace';

    logger.error(message, error);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('should handle string errors', () => {
    const message = 'String error';
    const errorString = 'This is a string error';

    logger.error(message, errorString);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('should track page views if available', () => {
    if (typeof logger.trackPageView === 'function') {
      const pageName = 'HomePage';
      const url = '/home';

      // Should not throw
      expect(() => {
        logger.trackPageView(pageName, url);
      }).not.toThrow();
    }
  });
});