export const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export function lerp(a: number, b: number, t: number): number {
  return a + ((b - a) * t);
}

/**
 * Determine whether val lies between lower and upper (inclusive)
 */
export function bounded(val: number, lower: number, upper: number): boolean {
  const epsilon = 0.0000001;
  return lower - epsilon <= val && val <= upper + epsilon;
}

/**
 * Calculate 2D cross product (i.e. signed area of parallelogram formed by
 * points (0,0), (x1, y1), (x2, y2), (x1 + x2, y1 + y2))
 */
export function cross2D(x1: number, y1: number, x2: number, y2: number): number {
  return (x1 * y2) - (x2 * y1)
}

export function idtrim(uuid: string): string {
  return uuid?.slice(-8);
}

export function increasingSortFn(a: number, b: number): number {
  return a - b;
}

export function rad2deg(x: number): number {
  return x * (180 / Math.PI);
}

export function circularPush<T>(a: T[], item: T, maxLength: number): T[] {
  a.push(item);
  if (a.length > maxLength) {
    return a.slice(1);
  } else {
    return a.slice();
  }
}

export function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function rowMajorIndex(
  row: number,
  column: number,
  width: number
): number {
  return row * width + column;
}

export function rowColumnFromIndex(index: number, width: number): [number, number] {
  const row = Math.floor(index / width);
  const col = index % width;
  return [row, col];
}
