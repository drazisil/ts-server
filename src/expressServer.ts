import express from 'express';
import pino from 'pino';

// Create an Express.js server
const app = express();
app.use(express.json());

// Middleware to enforce plain text responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/plain');
  next();
});

// Create a Pino logger
const logger = pino.default({
  transport: {
    target: 'pino-pretty',
  },
});

// Remove pino-http and configure logging manually
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      headers: req.headers,
    }, 'Request completed');
  });

  next();
});

// Create a router
const router = express.Router();

// Example route for handling HTTP requests
router.get('/AuthLogin', (req, res) => {
  res.send('Hello, HTTP!');
});

// Add a healthcheck endpoint
router.get('/healthcheck', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Attach the router to the app
app.use(router);

// Add a default 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Start the Express.js server
export const httpServer = app.listen(3002, '0.0.0.0', () => {
  console.log('Express server listening on port 3002');
});
