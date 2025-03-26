import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import expressWinston from 'express-winston';
import logger from './utils/logger';
import { RegisterRoutes } from './routes/routes';

// Load environment variables
dotenv.config();

// Create Express server
const app: express.Application = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'unpkg.com', "'unsafe-inline'"],
        styleSrc: ["'self'", 'unpkg.com', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'unpkg.com']
      }
    }
  })
);

// Logging
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms'
  })
);

// Register routes
RegisterRoutes(app);

// Health check route
app.get('/health', (req, res) => {
  res.send('API is running');
});


app.get('/', (req, res) => {
  res.send('try /api-docs');
});

// Error logging
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger
  })
);

export default app;
