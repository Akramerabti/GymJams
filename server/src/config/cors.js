const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://gymjams.ca' // Allow only the production client
    : ['http://localhost:3000', 'http://localhost:5173'], // Allow local development clients
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Include OPTIONS for preflight requests
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'x-platform',
    'X-App-Version'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true, // Allow cookies and credentials
  maxAge: 600 // Cache preflight results for 10 minutes
};

export default corsOptions;