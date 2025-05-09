import { createServer, Socket } from 'node:net';
import { decodePacket, type Packet } from './protocol.ts';

// Add a metrics object to track connection data
const metrics = {
  totalConnections: 0,
  activeConnections: 0,
  errors: 0,
};

export function startServer(port: number, onPacket: (packet: Packet, socket: Socket) => void): void {
  const server = createServer((socket) => {
    metrics.totalConnections++;
    metrics.activeConnections++;

    socket.on('data', (data) => {
      try {
        const packet = decodePacket(data);
        onPacket(packet, socket);
      } catch (error) {
        metrics.errors++;
        console.error('Failed to decode packet:', error);
      }
    });

    socket.on('close', () => {
      metrics.activeConnections--;
    });

    socket.on('error', (err) => {
      metrics.errors++;
      console.error('Socket error:', err);
    });
  });

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  // Start a CLI server for querying metrics
  const cliServer = createServer((socket) => {
    socket.on('data', (data) => {
      const command = data.toString().trim();
      if (command === 'stats') {
        socket.write(`Total Connections: ${metrics.totalConnections}\n`);
        socket.write(`Active Connections: ${metrics.activeConnections}\n`);
        socket.write(`Errors: ${metrics.errors}\n`);
      } else {
        socket.write('Unknown command\n');
      }
    });
  });

  cliServer.listen(port + 1, () => {
    console.log(`CLI server listening on port ${port + 1}`);
  });
}