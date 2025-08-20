// DOM Utility Module for GymJams
// Provides comprehensive DOM manipulation and screen detection utilities

// Type definitions
export interface OffsetModel {
  top: number;
  left: number;
}

export interface ViewPortModel {
  width: number;
  height: number;
}

export type ScreenType = "mobile" | "tablet" | "desktop";

export interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// Default breakpoints (Bootstrap-like)
const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

/**
 * Gets computed CSS style for an element
 */
function getCSS(el: HTMLElement, styleProp: string): string {
  const defaultView = (el.ownerDocument || document).defaultView;

  if (!defaultView) {
    return "";
  }

  // Sanitize property name to CSS notation (hyphen separated words)
  styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();

  return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
}

/**
 * Gets CSS variable value from document root
 */
function getCSSVariableValue(variableName: string): string {
  let value = getComputedStyle(document.documentElement).getPropertyValue(
    variableName
  );
  if (value && value.length > 0) {
    value = value.trim();
  }

  return value;
}

/**
 * Gets breakpoint value from CSS variables or defaults
 */
function getBreakpoint(breakpoint: keyof BreakpointConfig): number {
  // Try to get from CSS variables first
  const cssValue = getCSSVariableValue(`--bs-${breakpoint}`);
  if (cssValue) {
    const parsed = parseInt(cssValue.trim());
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  // Fallback to default breakpoints
  return DEFAULT_BREAKPOINTS[breakpoint];
}

/**
 * Gets the current viewport dimensions
 */
function getViewPort(): ViewPortModel {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Determines if the current device is mobile based on viewport and user agent
 */
function isMobileDevice(): boolean {
  let isMobile = getViewPort().width < getBreakpoint("lg");

  if (!isMobile) {
    // Check for iPad specifically
    isMobile = /iPad/i.test(navigator.userAgent);
  }

  return isMobile;
}

/**
 * Gets the current screen type based on viewport width and device detection
 */
function getScreenType(): ScreenType {
  const viewport = getViewPort();
  const width = viewport.width;

  // Check for mobile first
  if (width < getBreakpoint("md")) {
    return "mobile";
  }

  // Check for tablet
  if (width < getBreakpoint("lg")) {
    return "tablet";
  }

  // Check for iPad specifically (can have large viewport but still be tablet)
  if (/iPad/i.test(navigator.userAgent)) {
    return "tablet";
  }

  return "desktop";
}

/**
 * Gets element offset relative to document
 */
function getElementOffset(el: HTMLElement): OffsetModel {
  // Return zeros for disconnected and hidden elements
  if (!el.getClientRects().length) {
    return { top: 0, left: 0 };
  }

  const rect = el.getBoundingClientRect();
  const win = el.ownerDocument.defaultView;
  
  if (win) {
    return {
      top: rect.top + win.pageYOffset,
      left: rect.left + win.pageXOffset,
    };
  }

  return { top: rect.top, left: rect.left };
}

/**
 * Gets element's actual dimensions even if hidden
 */
function getElementActualDimensions(el: HTMLElement): { width: number; height: number } {
  const originalStyle = el.style.cssText;
  
  // Temporarily show element to measure
  el.style.cssText = "position: absolute; visibility: hidden; display: block;";
  
  const dimensions = {
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
  
  // Restore original style
  el.style.cssText = originalStyle;
  
  return dimensions;
}

/**
 * Checks if element is visible in viewport
 */
function isElementVisible(element: HTMLElement): boolean {
  return !(element.offsetWidth === 0 && element.offsetHeight === 0);
}

/**
 * Gets element's position in parent's children array
 */
function getElementIndex(element: HTMLElement): number {
  if (element.parentNode) {
    const children = element.parentNode.children;
    for (let i = 0; i < children.length; i++) {
      if (children[i] === element) return i;
    }
  }
  return -1;
}

/**
 * Checks if element matches selector
 */
function elementMatches(element: HTMLElement, selector: string): boolean {
  const matchesFn = element.matches || 
                   (element as any).webkitMatchesSelector || 
                   (element as any).msMatchesSelector;

  if (element && element.tagName && matchesFn) {
    return matchesFn.call(element, selector);
  }
  
  return false;
}

/**
 * Gets all parent elements matching selector
 */
function getElementParents(element: Element, selector?: string): Element[] {
  const parents: Element[] = [];
  let el: Element | null = element;

  // Traverse up the DOM tree
  for (; el && el !== document.body; el = el.parentElement) {
    if (selector) {
      if (elementMatches(el as HTMLElement, selector)) {
        parents.push(el);
      }
    } else {
      parents.push(el);
    }
  }

  return parents;
}

/**
 * Gets child elements matching selector
 */
function getElementChildren(element: HTMLElement, selector: string): HTMLElement[] {
  if (!element || !element.childNodes) {
    return [];
  }

  const result: HTMLElement[] = [];
  
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    
    if (child.nodeType === 1 && elementMatches(child as HTMLElement, selector)) {
      result.push(child as HTMLElement);
    }
  }

  return result;
}

/**
 * Gets first child element matching selector
 */
function getElementChild(element: HTMLElement, selector: string): HTMLElement | null {
  const children = getElementChildren(element, selector);
  return children.length > 0 ? children[0] : null;
}

/**
 * Gets current scroll position
 */
function getScrollTop(): number {
  return (document.scrollingElement || document.documentElement).scrollTop;
}

/**
 * Checks if element has all specified classes
 */
function hasClasses(element: HTMLElement, classesStr: string): boolean {
  const classes = classesStr.split(" ");
  return classes.every(cls => element.classList.contains(cls));
}

/**
 * Throttle function execution
 */
function throttle(func: Function, delay: number = 100): Function {
  let timeoutId: number | undefined;
  let lastExecTime = 0;
  
  return function (this: any, ...args: any[]) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * Debounce function execution
 */
function debounce(func: Function, delay: number = 100): Function {
  let timeoutId: number;
  
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Color manipulation utilities
 */
function lightenColor(color: string, amount: number): string {
  const addLight = (colorComponent: string, lightAmount: number): string => {
    const cc = parseInt(colorComponent, 16) + lightAmount;
    const cNum = cc > 255 ? 255 : cc;
    return cNum.toString(16).padStart(2, '0');
  };

  color = color.startsWith('#') ? color.substring(1) : color;
  amount = Math.round((255 * amount) / 100);
  
  return `#${addLight(color.substring(0, 2), amount)}${addLight(
    color.substring(2, 4),
    amount
  )}${addLight(color.substring(4, 6), amount)}`;
}

function darkenColor(color: string, amount: number): string {
  const subtractLight = (colorComponent: string, lightAmount: number): string => {
    const cc = parseInt(colorComponent, 16) - lightAmount;
    const cNum = cc < 0 ? 0 : cc;
    return cNum.toString(16).padStart(2, '0');
  };

  color = color.startsWith('#') ? color.substring(1) : color;
  amount = Math.round((255 * amount) / 100);

  return `#${subtractLight(color.substring(0, 2), amount)}${subtractLight(
    color.substring(2, 4),
    amount
  )}${subtractLight(color.substring(4, 6), amount)}`;
}

/**
 * Gets responsive attribute value based on current breakpoint
 */
function getResponsiveValue(responsiveAttr: any): any {
  if (typeof responsiveAttr !== "object") {
    return responsiveAttr;
  }

  const width = getViewPort().width;
  let resultValue = responsiveAttr.default;
  let resultBreakpoint = -1;

  for (const [key, value] of Object.entries(responsiveAttr)) {
    let breakpoint: number;
    
    if (key === "default") {
      breakpoint = 0;
    } else {
      const bpValue = getBreakpoint(key as keyof BreakpointConfig);
      breakpoint = bpValue || parseInt(key);
    }

    if (breakpoint <= width && breakpoint > resultBreakpoint) {
      resultValue = value;
      resultBreakpoint = breakpoint;
    }
  }

  return resultValue;
}

/**
 * Smooth scroll to element
 */
function scrollToElement(element: HTMLElement, offset: number = 0): void {
  const elementPosition = getElementOffset(element).top;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Check if element is in viewport
 */
function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const viewport = getViewPort();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewport.height &&
    rect.right <= viewport.width
  );
}

// Export all utilities
export {
  getCSS,
  getCSSVariableValue,
  getBreakpoint,
  getViewPort,
  getScreenType,
  isMobileDevice,
  getElementOffset,
  getElementActualDimensions,
  isElementVisible,
  getElementIndex,
  elementMatches,
  getElementParents,
  getElementChildren,
  getElementChild,
  getScrollTop,
  hasClasses,
  throttle,
  debounce,
  lightenColor,
  darkenColor,
  getResponsiveValue,
  scrollToElement,
  isElementInViewport,
};
