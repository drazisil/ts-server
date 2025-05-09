import { createServer, Socket } from 'node:net';
import { decodePacket, type Packet } from './protocol.ts';
import { randomUUID } from 'node:crypto';
import { httpApp } from './expressServer.js';
import { request as httpRequest, createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { isIPBanned } from './banning.js';

const logFile = path.join(process.cwd(), 'server.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const logger = pino.default({
  transport: {
    targets: [
      { target: 'pino/file', options: { destination: logFile } },
      { target: 'pino-pretty', options: { destination: 1 } }, // stdout
    ],
  },
});

// Replace metrics with a per-connection structure
const connections = new Map<string, { startTime: Date; dataReceived: number; errors: number }>();
const bannedIPs = new Set<string>();

const internalHttpServer = createHttpServer(httpApp);

export function startServer(ports: number[], cliPort: number, onPacket: (packet: Packet, socket: Socket) => void): void {
  try {
    ports.forEach((port) => {
      const server = createServer(handleClientConnection(onPacket));
      server.listen(port, config.host, () => {
        logger.info(`Server listening on ${config.host}:${port}`);
      });

      server.on('error', (err) => {
        logger.error({ err }, `Error on server listening on port ${port}`);
      });
    });

    const cliServer = createServer(handleCliConnection());
    cliServer.listen(cliPort, config.host, onCliServerListening);

    cliServer.on('listening', () => {
      logger.info(`CLI server successfully started on ${config.host}:${cliPort}`);
    });

    cliServer.on('error', (err) => {
      logger.error({ err }, `Error on CLI server listening on port ${cliPort}`);
    });
  } catch (err) {
    logger.error({ err }, 'Error initializing servers');
    process.exit(1);
  }
}

function onCliServerListening() {
  logger.info(`CLI server listening on ${config.host}:${config.cliPort}`);
}

function handleClientConnection(onPacket: (packet: Packet, socket: Socket) => void) {
  return (socket: Socket) => {
    if (isIPBanned(socket.remoteAddress || '')) {
      logger.info({ ip: socket.remoteAddress }, 'Connection attempt from banned IP');
      socket.end('Your IP has been banned.');
      return;
    }

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

  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = path;
  req.headers = headers;

  const res = new ServerResponse(req);
  res.assignSocket(socket);

  res.on('finish', () => {
    socket.end();
  });

  httpApp(req, res);
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
    socket.on('data', (data) => handleCliCommand(data, socket));
  };
}

function handleCliCommand(data: Buffer, socket: Socket) {
  const command = data.toString().trim();

  if (command === 'stats') {
    socket.write(`Total Connections: ${connections.size}\n`);
    connections.forEach((metrics, id) => {
      socket.write(`ID: ${id}, Start Time: ${metrics.startTime.toISOString()}, Data Received: ${metrics.dataReceived}, Errors: ${metrics.errors}\n`);
    });
  } else if (command === 'banned') {
    if (bannedIPs.size === 0) {
      socket.write('No IPs are currently banned.\n');
    } else {
      socket.write('Banned IPs:\n');
      bannedIPs.forEach((ip) => {
        socket.write(`${ip}\n`);
      });
    }
  } else if (command.startsWith('unban ')) {
    const ip = command.split(' ')[1];
    if (bannedIPs.has(ip)) {
      bannedIPs.delete(ip);
      socket.write(`IP ${ip} has been unbanned.\n`);
    } else {
      socket.write(`IP ${ip} is not in the banned list.\n`);
    }
  } else {
    socket.write('Unknown command\n');
  }
}