import type { Packet } from './protocol.ts';
import { Socket } from 'node:net';
import pino from 'pino';

const logger = pino.default();

export function handlePacket(packet: Packet, socket: Socket): void {
  logger.info({ packet }, 'Received packet');

  // Example response
  const response = { type: 1, payload: Buffer.from('Acknowledged') };
  socket.write(Buffer.concat([Buffer.from([response.type]), response.payload]));
}