const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://gymtonic.ca',
        'https://www.gymtonic.ca',
        'https://gymtonic.onrender.com',
        'https://saas-pl33-git-main-akramerabtis-projects.vercel.app',
        'https://saas-pl33-izz8roaoz-akramerabtis-projects.vercel.app',
        'https://saas-pl33-9fzcpos92-akramerabtis-projects.vercel.app',
        'https://api.stripe.com',
        'https://hooks.stripe.com',
        'https://dashboard.stripe.com',
        'https://gymtonic.onrender.com/api/subscription/webhook',
        // Add Google AdSense domains
        'https://pagead2.googlesyndication.com',
        'https://googleads.g.doubleclick.net',
        'https://partner.googleadservices.com',
        'https://www.google.com',
        'https://tpc.googlesyndication.com',
        'https://adservice.google.com'
      ]
    : [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:5000', 
        'https://api.stripe.com',
        'https://dashboard.stripe.com',
        // Also add AdSense domains for testing
        'https://pagead2.googlesyndication.com',
        'https://googleads.g.doubleclick.net',
        'https://partner.googleadservices.com',
        'https://www.google.com',
        'https://tpc.googlesyndication.com',
        'https://adservice.google.com'
      ],
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