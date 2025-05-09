import { startServer } from './server.ts';
import { handlePacket } from './handlers.ts';
import { ports } from './config.ts';

ports.forEach((port) => {
  startServer(port, handlePacket);
});