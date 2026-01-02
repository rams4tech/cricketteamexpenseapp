import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLogger } from '../services/logger';

/**
 * Custom Hook for Page Tracking
 *
 * Automatically tracks page views when a component mounts.
 * Use this hook in any page component to enable automatic page view tracking.
 *
 * @param {string} pageName - The name of the page (e.g., "Dashboard", "Players")
 * @param {Object} additionalProperties - Additional properties to track with the page view
 */
export const usePageTracking = (pageName, additionalProperties = {}) => {
  const location = useLocation();
  const logger = getLogger();

  useEffect(() => {
    logger.trackPageView(pageName, location.pathname, {
      ...additionalProperties,
      search: location.search,
      hash: location.hash
    });
  }, [pageName, location.pathname, location.search, location.hash, logger, additionalProperties]);
};

export default usePageTracking;