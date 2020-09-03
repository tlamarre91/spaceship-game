export const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export function lerp(a: number, b: number, t: number): number {
  return a + ((b - a) * t);
}

export function idtrim(uuid: string): string {
  return uuid?.slice(-8);
}
