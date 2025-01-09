import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import fs from 'fs';
import 'dotenv/config';


// Import configurations
import connectDB from './config/database.js';
import passport from './config/passport.js';
import corsOptions from './config/cors.js';
import authRoutes from './routes/auth.routes.js';
import { initStripe } from './config/stripe.js';

// Import routes
import routes from './routes/index.js';

// Import middleware
import { handleError, handleNotFound } from './middleware/error.middleware.js';
import { rateLimiter } from './middleware/auth.middleware.js';

// Import logger
import logger from './utils/logger.js';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load Swagger documentation
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'swagger.json'), 'utf8')
);

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize Stripe
initStripe();

app.use(cors(corsOptions));

// Security Middleware
app.use(helmet());
app.use(rateLimiter);

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stripe webhook handling (must be before body parser)
app.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      await handleStripeWebhook(event);
      res.json({ received: true });
    } catch (err) {
      logger.error('Webhook Error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Compress responses
app.use(compression());

// Initialize passport
app.use(passport.initialize());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// API Documentation - only in development
if (process.env.NODE_ENV === 'development') {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, { explorer: true })
  );
}

// Mount routes
app.use('/api', routes); // Mount other routes under /api
app.use('/api/auth', authRoutes); // Mount auth routes under /api/auth

// Handle production setup
if (process.env.NODE_ENV === 'production') {
  // Redirect all requests to the client
  app.get('*', (req, res) => {
    res.redirect('https://gymjams.ca');
  });
}

// Error Handling
app.use(handleNotFound);
app.use(handleError);

app.get('/', (req, res) => {
  res.send('API server running'); 
});


// Start server
const PORT = process.env.PORT || 5000;

let server;
try {
  server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    if (process.env.NODE_ENV === 'development') {
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    }
  });
} catch (error) {
  logger.error('Failed to start server:', error);
  process.exit(1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Close server & exit process
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export default app;