import { log } from "~shared/log";
import { bounded } from "~shared/util";

/**
 * Representation of a rectangle (or parallelogram in HexVector space) region
 */
export class BoxRegion {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;

  constructor(xMin: number, xMax: number, yMin: number, yMax: number) {
    if (xMin > xMax || yMin > yMax) {
      throw new Error(`invalid BoxRegion parameters: (${xMin}, ${xMax}, ${yMin}, ${yMax})`);
    }

    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
  }

  /**
   * Compute whether this BoxRegion overlaps another
   */
  overlaps(other: BoxRegion): boolean {
    if (bounded(other.xMin, this.xMin, this.xMax) || bounded(other.xMax, this.xMin, this.xMax)) {
      return bounded(other.yMin, this.yMin, this.yMax) || bounded(other.yMax, this.yMin, this.yMax);
    } else {
      return false;
    }
  }

  /**
   * Compute whether this BoxRegion contains a point
   */
  contains(x: number, y: number): boolean {
    return bounded(x, this.xMin, this.xMax) && bounded(y, this.yMin, this.yMax);
  }

  toString(): string {
    return `BoxRegion(${this.xMin}, ${this.xMax}, ${this.yMin}, ${this.yMax})`;
  }
};
