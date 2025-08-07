// Example usage of useScreenType hook in GymJams components
import React from 'react';
import { useScreenType } from '../hooks/useScreenType';

const ResponsiveExample = () => {
  const { screenType, isMobile, isTablet, isDesktop, viewport } = useScreenType();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Screen Type Detection Example</h2>
      
      <div className="grid gap-4 mb-6">
        <div className="bg-blue-100 p-3 rounded">
          <strong>Screen Type:</strong> {screenType}
        </div>
        
        <div className="bg-green-100 p-3 rounded">
          <strong>Device Flags:</strong>
          <ul className="list-disc list-inside mt-2">
            <li>Mobile: {isMobile ? '✅' : '❌'}</li>
            <li>Tablet: {isTablet ? '✅' : '❌'}</li>
            <li>Desktop: {isDesktop ? '✅' : '❌'}</li>
          </ul>
        </div>
        
        <div className="bg-yellow-100 p-3 rounded">
          <strong>Viewport:</strong> {viewport.width} × {viewport.height}
        </div>
      </div>

      {/* Responsive Layout Example */}
      <div className={`grid gap-4 ${
        isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'
      }`}>
        <div className="bg-red-200 p-4 rounded">Card 1</div>
        <div className="bg-red-200 p-4 rounded">Card 2</div>
        <div className="bg-red-200 p-4 rounded">Card 3</div>
        <div className="bg-red-200 p-4 rounded">Card 4</div>
      </div>

      {/* Conditional Content Based on Screen Type */}
      {isMobile && (
        <div className="mt-6 p-4 bg-purple-100 rounded">
          <h3 className="font-bold">Mobile-Only Content</h3>
          <p>This content only shows on mobile devices.</p>
        </div>
      )}

      {isTablet && (
        <div className="mt-6 p-4 bg-orange-100 rounded">
          <h3 className="font-bold">Tablet-Only Content</h3>
          <p>This content only shows on tablet devices.</p>
        </div>
      )}

      {isDesktop && (
        <div className="mt-6 p-4 bg-cyan-100 rounded">
          <h3 className="font-bold">Desktop-Only Content</h3>
          <p>This content only shows on desktop devices.</p>
        </div>
      )}
    </div>
  );
};

export default ResponsiveExample;
