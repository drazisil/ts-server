import { startServer } from './server.js';
import { handlePacket } from './handlers.js';
import { config } from './config.js';

startServer(config.ports, config.cliPort, handlePacket);