// server/src/middleware/custom-cors.middleware.js
import corsOptions from '../config/cors.js';
import cors from 'cors';

// Standard CORS middleware
const standardCors = cors(corsOptions);

// Custom middleware to handle ad network requests differently
export const customCorsMiddleware = (req, res, next) => {
  // Ad network domains that should bypass CORS restrictions
  const adNetworkDomains = [
    'doubleclick.net',
    'googleadservices.com',
    'googlesyndication.com',
    'googletagservices.com',
    'g.doubleclick.net',
    'google.com',
    'amazon-adsystem.com'
  ];
  
  // Check if the request comes from an ad network
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  
  const isAdNetwork = adNetworkDomains.some(domain => 
    origin.includes(domain) || referer.includes(domain)
  );
  
  if (isAdNetwork) {
    // For ad networks, add special headers and bypass regular CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // For OPTIONS requests (preflight), respond immediately
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    
    // For other methods, continue processing
    next();
  } else {
    // For regular requests, use the standard CORS middleware
    standardCors(req, res, next);
  }
};

export default customCorsMiddleware;