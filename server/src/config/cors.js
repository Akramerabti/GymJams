// server/src/config/cors.js
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          'https://gymtonic.ca',
          'https://www.gymtonic.ca',
          'https://gymtonic.onrender.com',
          'https://saas-pl33-git-main-akramerabtis-projects.vercel.app',
          'https://saas-pl33-izz8roaoz-akramerabtis-projects.vercel.app',
          'https://saas-pl33-9fzcpos92-akramerabtis-projects.vercel.app'
        ]
      : [
          'http://localhost:3000', 
          'http://localhost:5173', 
          'http://localhost:5000'
        ];
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('stripe.com')) {
      callback(null, true);
    } else {
      // For AdSense and other ad-related domains, silently accept but don't add CORS headers
      // This effectively makes the request "opaque" which works with ad services
      const adNetworkDomains = [
        // AdSense domains
        'pagead2.googlesyndication.com',
        'googleads.g.doubleclick.net',
        'tpc.googlesyndication.com',
        'www.googletagservices.com',
        
        // Keep Ad Manager domains for future use
        'doubleclick.net',
        'googleadservices.com',
        'googlesyndication.com',
        'googletagservices.com',
        'g.doubleclick.net',
        'google.com',
        'amazon-adsystem.com'
      ];
      
      // Check if origin is an ad network
      const isAdNetwork = adNetworkDomains.some(domain => origin.includes(domain));
      if (isAdNetwork) {
        // Accept the request but don't add CORS headers (for ad networks)
        callback(null, true);
      } else {
        // For other origins, reject with CORS error
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'x-platform',
    'X-App-Version',
    'Origin',
    'Accept',
    'Stripe-Signature',
    'x-gymbros-guest-token',
    'x-guest-token',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default corsOptions;