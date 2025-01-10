// cors.js
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://gymjams.ca',
        'https://www.gymjams.ca',
        'https://gymjams.onrender.com',
        'https://saas-pl33-git-main-akramerabtis-projects.vercel.app',
        'https://saas-pl33-izz8roaoz-akramerabtis-projects.vercel.app',
        'https://saas-pl33-9fzcpos92-akramerabtis-projects.vercel.app'
      ]
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'x-platform',
    'X-App-Version',
    'Origin',
    'Accept'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // Increased to 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default corsOptions;