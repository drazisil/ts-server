import { createServer, Socket } from 'node:net';
import { decodePacket, type Packet } from './protocol.ts';
import { randomUUID } from 'node:crypto';
import { httpServer } from './expressServer.ts';
import { request as httpRequest } from 'node:http';
import pino from 'pino';

const logger = pino.default();

// Replace metrics with a per-connection structure
const connections = new Map<string, { startTime: Date; dataReceived: number; errors: number }>();

export function startServer(port: number, onPacket: (packet: Packet, socket: Socket) => void): void {
  const server = createServer(handleClientConnection(onPacket));
  server.listen(port, '0.0.0.0', () => {
    logger.info(`Server listening on port ${port}`);
  });

  const cliServer = createServer(handleCliConnection());
  cliServer.listen(port + 1, '0.0.0.0', () => {
    logger.info(`CLI server listening on port ${port + 1}`);
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
    handleHttpRequest(socket, data);
  } else {
    processClientData(data, socket, onPacket);
  }
}

function handleHttpRequest(socket: Socket, data: Buffer) {
  logger.info('HTTP request detected, forwarding to Express.js');

  const dataString = data.toString();
  const [requestLine, ...headerLines] = dataString.split('\r\n');
  const [method, path] = requestLine.split(' ');

  const headers = headerLines.reduce((acc, line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex > -1) {
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  const options = {
    hostname: '0.0.0.0',
    port: 3002,
    method,
    path,
    headers,
  };

  const req = httpRequest(options, (res) => {
    socket.write(`HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage}\r\n`);
    Object.entries(res.headers).forEach(([key, value]) => {
      socket.write(`${key}: ${value}\r\n`);
    });
    socket.write('\r\n');

    res.on('data', (chunk) => {
      socket.write(chunk);
    });

    res.on('end', () => {
      socket.end();
    });
  });

  req.on('error', (err) => {
    logger.error({ err }, 'Error forwarding HTTP request');
    socket.end();
  });

  req.write(data);
  req.end();
}

function closeConnection(connectionId: string) {
  connections.delete(connectionId);
}

function handleSocketError(err: Error, connectionId: string) {
  const connection = connections.get(connectionId);
  if (connection) {
    connection.errors++;
  }
  logger.error({ err }, 'Socket error');
}

function detectHttpRequest(dataString: string): boolean {
  return /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH) \/.* HTTP\/.*/.test(dataString);
}

function processClientData(data: Buffer, socket: Socket, onPacket: (packet: Packet, socket: Socket) => void) {
  try {
    const packet = decodePacket(data);
    onPacket(packet, socket);
  } catch (error) {
    logger.error({ error }, 'Failed to decode packet');
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