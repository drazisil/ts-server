const bannedIPs = new Set<string>();

export function isIPBanned(ip: string): boolean {
  return bannedIPs.has(ip);
}

export function banIP(ip: string): void {
  bannedIPs.add(ip);
}

export function unbanIP(ip: string): void {
  bannedIPs.delete(ip);
}

export function getBannedIPs(): string[] {
  return Array.from(bannedIPs);
}
