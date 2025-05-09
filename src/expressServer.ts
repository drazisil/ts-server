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
      remoteHost: req.ip,
      remotePort: req.socket.remotePort,
      method: req.method,
      host: req.headers.host,
      path: req.path,
    }, 'Request completed');
  });

  next();
});

// Define an array of disallowed routes
const disallowedRoutes = ['/forbidden', '/admin', '/restricted'];

// Middleware to auto-ban connections trying to access disallowed routes
const bannedIPs = new Set<string>();

app.use((req, res, next) => {
  if (bannedIPs.has(req.ip)) {
    res.status(403).send('Your IP has been banned.');
    return;
  }

  if (disallowedRoutes.includes(req.path)) {
    bannedIPs.add(req.ip);
    res.status(403).send('Access to this route is forbidden. Your IP has been banned.');
    return;
  }

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

// Export the Express app directly for internal use
export const httpApp = app;
