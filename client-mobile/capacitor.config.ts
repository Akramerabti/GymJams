// server/src/config/cors.js
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          // Production web domains
          'https://gymtonic.ca',
          'https://www.gymtonic.ca',
          'https://gymtonic.onrender.com',
          
          // Vercel deployment URLs (consider using environment variables)
          'https://saas-pl33-git-main-akramerabtis-projects.vercel.app',
          'https://saas-pl33-izz8roaoz-akramerabtis-projects.vercel.app',
          'https://saas-pl33-9fzcpos92-akramerabtis-projects.vercel.app',
          
          // Mobile app schemes - THESE ARE CORRECT for deeplinks
          'capacitor://localhost',
          'ionic://localhost',
          
          // Remove these broad localhost entries for production security
          // 'http://localhost',   // TOO BROAD - REMOVE
          // 'https://localhost'   // TOO BROAD - REMOVE
        ]
      : [
          // Development - specify exact ports
          'http://localhost:3000',
          'http://localhost:5173', 
          'http://localhost:5000',
          'http://localhost:8100',  // Ionic dev server
          
          // Mobile schemes for development
          'capacitor://localhost',
          'ionic://localhost'
        ];

    // Stripe domains - be more specific
    const stripePattern = /^https:\/\/(js\.stripe\.com|checkout\.stripe\.com|api\.stripe\.com)$/;
    const isStripeOrigin = stripePattern.test(origin);

    // Check exact origin match
    if (allowedOrigins.includes(origin) || isStripeOrigin) {
      return callback(null, true);
    }

    // Ad network handling with exact domain matching
    const adNetworkPatterns = [
      /^https:\/\/pagead2\.googlesyndication\.com$/,
      /^https:\/\/googleads\.g\.doubleclick\.net$/,
      /^https:\/\/tpc\.googlesyndication\.com$/,
      /^https:\/\/www\.googletagservices\.com$/,
      /^https:\/\/[a-z0-9-]+\.doubleclick\.net$/,
      /^https:\/\/[a-z0-9-]+\.googleadservices\.com$/,
      /^https:\/\/[a-z0-9-]+\.googlesyndication\.com$/,
      /^https:\/\/[a-z0-9-]+\.amazon-adsystem\.com$/
    ];
    
    const isAdNetwork = adNetworkPatterns.some(pattern => pattern.test(origin));
    
    if (isAdNetwork) {
      // Accept ad network requests
      return callback(null, true);
    }

    // Log rejected origins for debugging (in development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`CORS: Rejected origin: ${origin}`);
    }
    
    callback(new Error('Not allowed by CORS'));
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
    'x-guest-token'
  ],
  
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default corsOptions;