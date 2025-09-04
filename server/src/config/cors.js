// server/src/config/cors.js
const PRODUCTION_ORIGINS = new Set([
  'https://gymtonic.ca',
  'https://www.gymtonic.ca',
  'https://gymtonic.onrender.com',
  'https://saas-pl33-git-main-akramerabtis-projects.vercel.app',
  'https://saas-pl33-izz8roaoz-akramerabtis-projects.vercel.app',
  'https://saas-pl33-9fzcpos92-akramerabtis-projects.vercel.app',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost'
]);

const DEVELOPMENT_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost'
]);

// Pre-compiled regex for faster matching
const AD_NETWORK_REGEX = /(?:pagead2\.googlesyndication\.com|googleads\.g\.doubleclick\.net|tpc\.googlesyndication\.com|www\.googletagservices\.com|doubleclick\.net|googleadservices\.com|googlesyndication\.com|googletagservices\.com|g\.doubleclick\.net|google\.com|amazon-adsystem\.com)/;
const STRIPE_REGEX = /stripe\.com/;

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Use Set for O(1) lookup instead of Array.indexOf O(n)
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? PRODUCTION_ORIGINS 
      : DEVELOPMENT_ORIGINS;
    
    // Fast Set lookup
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    
    // Fast regex check for Stripe and ad networks
    if (STRIPE_REGEX.test(origin) || AD_NETWORK_REGEX.test(origin)) {
      return callback(null, true);
    }
    
    // Reject all others
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
    'x-guest-token',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default corsOptions;