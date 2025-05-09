import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';

// Create an Express.js server
const app = express();
app.use(express.json());

// Create a Pino logger
const logger = pino.default({
  transport: {
    target: 'pino-pretty',
  },
});

// Use Pino HTTP middleware to log HTTP requests
app.use(pinoHttp.default({ logger }));

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
