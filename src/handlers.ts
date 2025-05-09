import type { Packet } from './protocol.ts';
import { Socket } from 'node:net';

export function handlePacket(packet: Packet, socket: Socket): void {
  console.log('Received packet:', packet);

  // Example response
  const response = { type: 1, payload: Buffer.from('Acknowledged') };
  socket.write(Buffer.concat([Buffer.from([response.type]), response.payload]));
}