import { addBannedIP, removeBannedIP, isIPBanned as dbIsIPBanned, getBannedIPs as dbGetBannedIPs } from './database.js';

export async function isIPBanned(ip: string): Promise<boolean> {
  return dbIsIPBanned(ip);
}

export async function banIP(ip: string): Promise<void> {
  await addBannedIP(ip);
}

export async function unbanIP(ip: string): Promise<void> {
  await removeBannedIP(ip);
}

export async function getBannedIPs(): Promise<string[]> {
  return dbGetBannedIPs();
}
