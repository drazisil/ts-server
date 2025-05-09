import { createServer, Socket } from 'node:net';
import { decodePacket, type Packet } from './protocol.ts';

export function startServer(port: number, onPacket: (packet: Packet, socket: Socket) => void): void {
  const server = createServer((socket) => {
    socket.on('data', (data) => {
      try {
        const packet = decodePacket(data);
        onPacket(packet, socket);
      } catch (error) {
        console.error('Failed to decode packet:', error);
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}