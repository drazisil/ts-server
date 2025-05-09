import { startServer } from './server.js';
import { handlePacket } from './handlers.js';
import { config } from './config.js';
import { initializeDatabase } from './database.js';
import { initializeModels } from './models.js';

// Initialize the database
initializeDatabase().then(() => {
  console.log('Database initialized');
});

// Initialize Sequelize models
initializeModels().then(() => {
  console.log('Sequelize models initialized');
});

startServer(config.ports, config.cliPort, handlePacket);