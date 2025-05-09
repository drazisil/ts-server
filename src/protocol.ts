export interface Packet {
  type: number;
  payload: Buffer;
}

export function encodePacket(packet: Packet): Buffer {
  const typeBuffer = Buffer.alloc(1);
  typeBuffer.writeUInt8(packet.type, 0);

  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(packet.payload.length, 0);

  return Buffer.concat([typeBuffer, lengthBuffer, packet.payload]);
}

export function decodePacket(buffer: Buffer): Packet {
  const type = buffer.readUInt8(0);
  const length = buffer.readUInt32BE(1);
  const payload = buffer.slice(5, 5 + length);

  return { type, payload };
}