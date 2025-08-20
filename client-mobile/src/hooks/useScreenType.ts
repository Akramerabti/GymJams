import { useState, useEffect } from 'react';
import { getScreenType, getViewPort, debounce, type ScreenType } from '../utils/domUtils';

export interface UseScreenTypeReturn {
  screenType: ScreenType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * Custom hook for detecting screen type and viewport changes
 * Includes debounced resize handling for better performance
 */
export function useScreenType(): UseScreenTypeReturn {
  const [screenType, setScreenType] = useState<ScreenType>(() => {
    // Initialize with current screen type on mount
    if (typeof window !== 'undefined') {
      return getScreenType();
    }
    return 'desktop'; // Default for SSR
  });

  const [viewport, setViewport] = useState(() => {
    if (typeof window !== 'undefined') {
      return getViewPort();
    }
    return { width: 1200, height: 800 }; // Default for SSR
  });

  useEffect(() => {
    // Update screen type and viewport on mount and resize
    const updateScreenInfo = () => {
      const newScreenType = getScreenType();
      const newViewport = getViewPort();
      
      setScreenType(newScreenType);
      setViewport(newViewport);
    };

    // Debounced resize handler to avoid excessive re-renders
    const debouncedUpdate = debounce(updateScreenInfo, 150) as EventListener;

    // Initial update
    updateScreenInfo();

    // Add resize listener
    window.addEventListener('resize', debouncedUpdate);
    
    // Also listen for orientation change on mobile devices
    window.addEventListener('orientationchange', debouncedUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
    };
  }, []);

  return {
    screenType,
    isMobile: screenType === 'mobile',
    isTablet: screenType === 'tablet',
    isDesktop: screenType === 'desktop',
    viewport,
  };
}

export default useScreenType;
