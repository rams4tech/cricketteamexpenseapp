import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { getLogger } from './logger';

/**
 * Axios Interceptor for Request/Response Logging and Correlation Tracking
 *
 * This interceptor:
 * 1. Adds correlation IDs to all outgoing requests
 * 2. Logs all API requests and responses
 * 3. Tracks API call duration
 * 4. Enables end-to-end tracing across client and server
 */

let isInterceptorSetup = false;

export const setupAxiosInterceptors = () => {
  if (isInterceptorSetup) {
    return;
  }

  const logger = getLogger();

  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      // Generate or use existing correlation ID
      const correlationId = uuidv4();
      config.headers['x-correlation-id'] = correlationId;

      // Store correlation ID and start time in config for response logging
      config.metadata = {
        correlationId,
        startTime: Date.now()
      };

      // Log the outgoing request
      logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        method: config.method,
        url: config.url,
        correlationId,
        hasAuth: !!config.headers['Authorization']
      });

      return config;
    },
    (error) => {
      logger.error('API Request Error', error, {
        message: error.message
      });
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      const duration = Date.now() - (response.config.metadata?.startTime || 0);
      const correlationId = response.config.metadata?.correlationId;

      // Log successful response
      logger.info(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`, {
        method: response.config.method,
        url: response.config.url,
        statusCode: response.status,
        duration,
        correlationId,
        serverCorrelationId: response.headers['x-correlation-id']
      });

      // Track the API call in Application Insights
      logger.trackApiCall(
        response.config.method?.toUpperCase() || 'GET',
        response.config.url || '',
        duration,
        response.status,
        true,
        {
          correlationId,
          serverCorrelationId: response.headers['x-correlation-id']
        }
      );

      return response;
    },
    (error) => {
      const config = error.config || {};
      const duration = Date.now() - (config.metadata?.startTime || 0);
      const correlationId = config.metadata?.correlationId;
      const statusCode = error.response?.status || 0;

      // Log error response
      logger.error(
        `API Error: ${config.method?.toUpperCase()} ${config.url} - ${statusCode}`,
        error,
        {
          method: config.method,
          url: config.url,
          statusCode,
          duration,
          correlationId,
          serverCorrelationId: error.response?.headers?.['x-correlation-id'],
          errorMessage: error.message,
          responseData: error.response?.data
        }
      );

      // Track the failed API call
      logger.trackApiCall(
        config.method?.toUpperCase() || 'GET',
        config.url || '',
        duration,
        statusCode,
        false,
        {
          correlationId,
          serverCorrelationId: error.response?.headers?.['x-correlation-id'],
          errorMessage: error.message
        }
      );

      return Promise.reject(error);
    }
  );

  isInterceptorSetup = true;
  console.log('Axios interceptors configured for logging and correlation tracking');
};

export default setupAxiosInterceptors;