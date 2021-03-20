/**
 * Hexagonal coordinate system based on https://www.redblobgames.com/grids/hexagons/
 * Uses immutable data structures for hexagonal vectors
 */

import { lerp, rowMajorIndex } from "~shared/util";
import { BoxRegion } from "./BoxRegion";

const { sqrt, random, abs, round, max, min } = Math;

export type HexSystem = "c" | "a"; // cubic or axial
export type HexDirection = "y-z" | "z-y" | "x-z" | "z-x" | "y-x" | "x-y";
/**
 * array of names of each major axis direction in the hexagonal coordinate system
 */
export const HEX_DIRECTIONS: HexDirection[] = [
  "x-z", // right
  "y-z", // down-right
  "y-x", // down-left
  "z-x", // left
  "z-y", // up-left
  "x-y", // up-right
];

/**
 * Vector object for positioning objects in hexagonal coordinate space
 */
export class HexVector {
  static readonly EPSILON = 0.0000001; // TODO: really shouldn't use absolute epsilon. should be relative.
  static readonly EPSILON_CUBIC = HexVector.fromCubicCoordinates(
    0.1 * HexVector.EPSILON,
    0.2 * HexVector.EPSILON,
    -0.3 * HexVector.EPSILON
  );
  static readonly ZERO = HexVector.fromAxialCoordinates(0, 0);

  readonly x: number;
  readonly y: number;
  readonly z: number | null;
  readonly system: HexSystem;

  constructor(
    system: HexSystem,
    x: number,
    y: number,
    z: number | null = null
  ) {
    if (system == "c") {
      if (z == null) {
        throw new Error("cubic coordinates need z component");
      } else if (x + y + z > HexVector.EPSILON) {
        throw new Error(`invalid cubic coordinates: (${x}, ${y}, ${z})`);
      } else {
        this.system = system;
        this.x = x;
        this.y = y;
        this.z = z;
      }
    } else {
      if (z != null) {
        throw new Error("axial coordinates may not have z component");
      } else {
        this.system = system;
        this.x = x;
        this.y = y;
        this.z = null;
      }
    }
  }

  /**
   * get HexVector from cartesian coordinates (i.e. pixel
   * coordinates when scaled appropriately)
   */
  static fromCartesianCoordinates(
    x: number,
    y: number,
    scale: number = 1
  ): HexVector {
    const q = ((sqrt(3) / 3) * x - (1 / 3) * y) / scale;
    const r = ((2 / 3) * y) / scale;
    return HexVector.fromAxialCoordinates(q, r);
  }

  /**
   * Make a new hex-space vector from cubic coordinates, where z = -x - y
   */
  static fromCubicCoordinates(x: number, y: number, z: number): HexVector {
    return new HexVector("c", x, y, z);
  }

  /**
   * Make a new hex-space vector from a pair of coordinates, where x is
   * horizontal position, y is diagonal position
   */
  static fromAxialCoordinates(x: number, y: number): HexVector {
    return new HexVector("a", x, y);
  }

  static copy(v: HexVector): HexVector {
    return new HexVector(v.system, v.x, v.y, v.z);
  }

  static direction(direction: HexDirection): HexVector {
    switch (direction) {
      case "y-z":
        return HexVector.fromCubicCoordinates(0, 1, -1);
      case "z-y":
        return HexVector.fromCubicCoordinates(0, -1, 1);
      case "x-z":
        return HexVector.fromCubicCoordinates(1, 0, -1);
      case "z-x":
        return HexVector.fromCubicCoordinates(-1, 0, 1);
      case "y-x":
        return HexVector.fromCubicCoordinates(-1, 1, 0);
      case "x-y":
        return HexVector.fromCubicCoordinates(1, -1, 0);
    }
  }

  static random({ xMin, xMax, yMin, yMax }: BoxRegion): HexVector {
    const rx = xMax - xMin;
    const ry = yMax - yMin;
    const x = xMin + random() * rx;
    const y = yMin + random() * ry;
    return HexVector.fromAxialCoordinates(x, y);
  }

  /**
   * generate a 2D array representing a paralellogram-ular region of HexVectors
   *
   * @param xCount - number of rows in output array
   * @param yCount - number of columns in output array
   * @param xBasis - basis vector generating first element of each row
   * @param yBasis - basis vector generating each row from first element
   */
  static tile2D(
    xCount: number,
    yCount: number,
    xBasis: HexVector,
    yBasis: HexVector
  ): HexVector[] {
    const resultLength = xCount * yCount;
    const tiles: HexVector[] = new Array<HexVector>(resultLength);
    for (let i = 0; i < xCount; i += 1) {
      for (let j = 0; j < yCount; j += 1) {
        //const tileIndex = i * yCount + j; // TODO: I think this is wrong.
        const tileIndex = rowMajorIndex(i, j, yCount);
        const newTile = xBasis.times(i).plus(yBasis.times(j));
        tiles[tileIndex] = newTile;
      }
    }

    return tiles;
  }

  toString(): string {
    if (this.system == "c") {
      return `HexVector(c, ${this.x}, ${this.y}, ${this.z})`;
    } else {
      return `HexVector(a, ${this.x}, ${this.y})`;
    }
  }

  /**
   * Get cartesian coordinates of this vector (i.e. pixel
   * coordinates when scaled appropriately)
   */
  toCartesian(scale: number = 1): [number, number] {
    const v = this.toAxial();
    const x = scale * (sqrt(3) * v.x + (sqrt(3) / 2) * v.y);
    const y = scale * 1.5 * v.y;
    return [x, y];
  }

  toCubic(): HexVector {
    if (this.system == "c") {
      return this;
    } else {
      const x = this.x;
      const y = this.y;
      const z = -x - y;
      return new HexVector("c", x, y, z);
    }
  }

  toAxial(): HexVector {
    if (this.system == "a") {
      return this;
    } else {
      return new HexVector("a", this.x, this.y);
    }
  }

  equals(v: HexVector): boolean {
    if (v.system == "c") {
      const { x, y, z } = this.toCubic();
      return (
        abs(v.x - x) <= HexVector.EPSILON &&
        abs(v.y - y) <= HexVector.EPSILON &&
        abs(v.z! - z!) <= HexVector.EPSILON
      );
    } else {
      const { x, y } = this.toAxial();
      return (
        abs(v.x - x) <= HexVector.EPSILON && abs(v.y - y) <= HexVector.EPSILON
      );
    }
  }

  plus(v: HexVector): HexVector {
    if (v.system == "c") {
      const { x, y, z } = this.toCubic();
      return HexVector.fromCubicCoordinates(x + v.x, y + v.y, z! + v.z!);
    } else {
      const { x, y } = this.toAxial();
      return HexVector.fromAxialCoordinates(x + v.x, y + v.y);
    }
  }

  minus(v: HexVector): HexVector {
    if (v.system == "c") {
      const { x, y, z } = this.toCubic();
      return HexVector.fromCubicCoordinates(x - v.x, y - v.y, z! - v.z!);
    } else {
      const { x, y } = this.toAxial();
      return HexVector.fromAxialCoordinates(x - v.x, y - v.y);
    }
  }

  times(scalar: number): HexVector {
    if (this.system == "c") {
      const { x, y, z } = this;
      return HexVector.fromCubicCoordinates(
        x * scalar,
        y * scalar,
        z! * scalar
      );
    } else {
      const { x, y } = this;
      return HexVector.fromAxialCoordinates(x * scalar, y * scalar);
    }
  }

  neighbors(): HexVector[] {
    return [
      HexVector.direction("x-y"),
      HexVector.direction("y-x"),
      HexVector.direction("x-z"),
      HexVector.direction("z-x"),
      HexVector.direction("z-y"),
      HexVector.direction("y-z"),
    ].map((v) => v.plus(this));
  }

  gridDistance(v: HexVector): number {
    const { x, y, z } = this.cubicRound();
    const rv = v.cubicRound();
    return (abs(x - rv.x) + abs(y - rv.y) + abs(z! - rv.z!)) / 2;
  }

  gridMagnitude(): number {
    return this.gridDistance(HexVector.ZERO);
  }

  /**
   * Round this vector to the center of a hexagon on the unit hex lattice
   */
  cubicRound(): HexVector {
    const { x, y, z } = this.toCubic();
    let [rx, ry, rz] = [x, y, z].map(round);
    const [dx, dy, dz] = [abs(rx - x), abs(ry - y), abs(rz - z!)];
    if (dx > dy && dx > dz) {
      rx = -ry - rz;
    } else if (dy > dz) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }

    return HexVector.fromCubicCoordinates(rx, ry, rz);
  }

  /**
   * Return linear interpolation of two HexVectors, where 0 <= t <= 1 returns
   * a vector on the line segment from this to v
   */
  cubicLerp(v: HexVector, t: number): HexVector {
    const w = v.toCubic();
    const { x, y, z } = this.toCubic();
    return HexVector.fromCubicCoordinates(
      lerp(x, w.x, t),
      lerp(y, w.y, t),
      lerp(z!, w.z!, t)
    );
  }

  pathTo(
    v: HexVector,
    includeStart?: boolean,
    includeEnd?: boolean
  ): HexVector[] {
    const path: HexVector[] = [];
    // round this vector to lattice, then offset by a tiny vector to make path lie inside
    // hexagons as opposed to on hex edges, which can cause funky output
    const u = this.cubicRound().plus(HexVector.EPSILON_CUBIC);
    const length = this.gridDistance(v);
    const start = includeStart ? 0 : 1;
    const end = length - (includeEnd ? 0 : 1);
    for (let i = start; i < end; i += 1) {
      path.push(u.cubicLerp(v, i / length).cubicRound());
    }

    return path;
  }

  gridWithinRange(range: number): HexVector[] {
    if (range <= 0) {
      throw new Error("gridWithinRange cannot handle negative range");
    }

    const results: HexVector[] = [];
    const { x, y, z } = this.toCubic();
    for (let i = -range; i <= range; i += 1) {
      for (
        let j = max(-range, -x - range);
        j < min(range, -x + range);
        j += 1
      ) {
        const k = -i - j;
        results.push(this.plus(HexVector.fromCubicCoordinates(i, j, k)));
      }
    }

    return results;
  }
}
