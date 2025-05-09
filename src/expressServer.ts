import express from 'express';

// Create an Express.js server
const app = express();
app.use(express.json());

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
export const httpServer = app.listen(3002, () => {
  console.log('Express server listening on port 3002');
});
