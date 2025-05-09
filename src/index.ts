import { startServer } from './server.js';
import { handlePacket } from './handlers.js';
import { config } from './config.js';
import { initializeDatabase } from './database.js';

// Initialize the database
initializeDatabase().then(() => {
  console.log('Database initialized');
});

startServer(config.ports, config.cliPort, handlePacket);