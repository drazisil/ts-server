import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Open the database connection
export const dbPromise = open({
  filename: 'banned_ips.db',
  driver: sqlite3.Database,
});

export async function initializeDatabase() {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS banned_ips (
      ip TEXT PRIMARY KEY
    );
  `);
}

export async function addBannedIP(ip: string): Promise<void> {
  const db = await dbPromise;
  await db.run('INSERT OR IGNORE INTO banned_ips (ip) VALUES (?)', ip);
}

export async function removeBannedIP(ip: string): Promise<void> {
  const db = await dbPromise;
  await db.run('DELETE FROM banned_ips WHERE ip = ?', ip);
}

export async function isIPBanned(ip: string): Promise<boolean> {
  const db = await dbPromise;
  const row = await db.get('SELECT 1 FROM banned_ips WHERE ip = ?', ip);
  return !!row;
}

export async function getBannedIPs(): Promise<string[]> {
  const db = await dbPromise;
  const rows = await db.all('SELECT ip FROM banned_ips');
  return rows.map((row) => row.ip);
}
