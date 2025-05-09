import type { Packet } from './protocol.ts';
import { decodePacket } from './protocol.ts';
import { Socket } from 'node:net';
import pino from 'pino';

const logger = pino.default();

export function handlePacket(packet: Packet, socket: Socket): void {
  logger.info({ packet }, 'Received packet');

  try {
    // Decode the packet using the custom binary protocol
    const decodedPacket = decodePacket(packet.payload);
    logger.info({ decodedPacket }, 'Decoded packet');

    // Example response based on the decoded packet
    const response = { type: decodedPacket.type, payload: Buffer.from('Acknowledged') };
    socket.write(Buffer.concat([Buffer.from([response.type]), response.payload]));
  } catch (error) {
    logger.error({ error }, 'Failed to decode packet');
    socket.end();
  }
}