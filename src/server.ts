import { createServer, Socket } from 'node:net';
import { decodePacket, type Packet } from './protocol.ts';
import { randomUUID } from 'node:crypto';
import { httpServer } from './expressServer.ts';

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
    const connectionId = initializeConnection(socket);

    socket.on('data', (data) => handleSocketData(data, socket, connectionId, onPacket));
    socket.on('close', () => closeConnection(connectionId));
    socket.on('error', (err) => handleSocketError(err, connectionId));
  };
}

function initializeConnection(socket: Socket): string {
  const connectionId = randomUUID();
  connections.set(connectionId, { startTime: new Date(), dataReceived: 0, errors: 0 });
  return connectionId;
}

function handleSocketData(
  data: Buffer,
  socket: Socket,
  connectionId: string,
  onPacket: (packet: Packet, socket: Socket) => void
) {
  const connection = connections.get(connectionId);
  if (connection) {
    connection.dataReceived += data.length;
  }

  const dataString = data.toString();
  if (detectHttpRequest(dataString)) {
    handleHttpRequest(socket);
  } else {
    processClientData(data, socket, onPacket);
  }
}

function handleHttpRequest(socket: Socket) {
  console.log('HTTP request detected, forwarding to Express.js');
  socket.write('HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n');
}

function closeConnection(connectionId: string) {
  connections.delete(connectionId);
}

function handleSocketError(err: Error, connectionId: string) {
  const connection = connections.get(connectionId);
  if (connection) {
    connection.errors++;
  }
  console.error('Socket error:', err);
}

function detectHttpRequest(dataString: string): boolean {
  return /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH) \/.* HTTP\/.*/.test(dataString);
}

function processClientData(data: Buffer, socket: Socket, onPacket: (packet: Packet, socket: Socket) => void) {
  try {
    const packet = decodePacket(data);
    onPacket(packet, socket);
  } catch (error) {
    console.error('Failed to decode packet:', error);
  }
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