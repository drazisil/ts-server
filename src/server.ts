import { createServer, Socket } from 'node:net';
import { decodePacket, type Packet } from './protocol.ts';
import { randomUUID } from 'node:crypto';

// Replace metrics with a per-connection structure
const connections = new Map<string, { startTime: Date; dataReceived: number; errors: number }>();

export function startServer(port: number, onPacket: (packet: Packet, socket: Socket) => void): void {
  const server = createServer(handleClientConnection(onPacket));
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  const cliServer = createServer(handleCliConnection());
  cliServer.listen(port + 1, () => {
    console.log(`CLI server listening on port ${port + 1}`);
  });
}

function handleClientConnection(onPacket: (packet: Packet, socket: Socket) => void) {
  return (socket: Socket) => {
    const connectionId = randomUUID();
    connections.set(connectionId, { startTime: new Date(), dataReceived: 0, errors: 0 });

    socket.on('data', (data) => {
      const connection = connections.get(connectionId);
      if (connection) {
        connection.dataReceived += data.length;
      }
      processClientData(data, socket, onPacket);
    });

    socket.on('close', () => {
      connections.delete(connectionId);
    });

    socket.on('error', (err) => {
      const connection = connections.get(connectionId);
      if (connection) {
        connection.errors++;
      }
      handleSocketError(err);
    });
  };
}

function processClientData(data: Buffer, socket: Socket, onPacket: (packet: Packet, socket: Socket) => void) {
  try {
    const packet = decodePacket(data);
    onPacket(packet, socket);
  } catch (error) {
    console.error('Failed to decode packet:', error);
  }
}

function handleSocketError(err: Error) {
  console.error('Socket error:', err);
}

function handleCliConnection() {
  return (socket: Socket) => {
    socket.on('data', (data) => processCliCommand(data, socket));
  };
}

function processCliCommand(data: Buffer, socket: Socket) {
  const command = data.toString().trim();
  if (command === 'stats') {
    socket.write(`Total Connections: ${connections.size}\n`);
    connections.forEach((metrics, id) => {
      socket.write(`ID: ${id}, Start Time: ${metrics.startTime.toISOString()}, Data Received: ${metrics.dataReceived}, Errors: ${metrics.errors}\n`);
    });
  } else {
    socket.write('Unknown command\n');
  }
}