import { log } from "~shared/log";
import { BoxRegion } from "./BoxRegion";
import {
  lerp,
  bounded,
  cross2D
} from "~shared/util";

import {
  HexVector
} from "./HexVector";

export class HexSegment {
  start: HexVector;
  end: HexVector;

  constructor(start: HexVector, end: HexVector) {
    this.start = start;
    this.end = end;
  }

  boundingBox(): BoxRegion {
    const {
      x: x1,
      y: y1
    } = this.start;
    const {
      x: x2,
      y: y2
    } = this.end;

    const [xMin, xMax] = [x1, x2].sort();
    const [yMin, yMax] = [y1, y2].sort();

    return new BoxRegion(xMin, xMax, yMin, yMax);
  }

  broadPhase(other: HexSegment): boolean {
    return this.boundingBox().overlaps(other.boundingBox());
  }

  /**
   * Get the sub-segment spanning startPoint to endPoint distance along this
   * segment. (Should have both arguments bounded by 0 and 1.)
   */
  sample(startPoint: number, endPoint: number): HexSegment {
    const startVector = this.start.cubicLerp(this.end, startPoint);
    const endVector = this.start.cubicLerp(this.end, endPoint);
    return new HexSegment(startVector, endVector);
  }

  /**
   * Compute intersection between two segments, returning null if there is no
   * intersection (or if the algorithm otherwise bugged out, as in the case of
   * collinear overlapping segments).
   *
   * @remarks
   * based on https://stackoverflow.com/a/1968345
   * No, I do not know how it works. This method should be used in conjunction
   * with gridOverlap(other) and broadPhase(other) to compute collisions.
   */
  intersection(other: HexSegment): HexVector | null {
    const {
      x: x1,
      y: y1
    } = this.start;
    const {
      x: x2,
      y: y2
    } = this.end;
    const {
      x: x3,
      y: y3
    } = other.start;
    const {
      x: x4,
      y: y4
    } = other.end;

    const dx1 = x2 - x1;
    const dy1 = y2 - y1;
    const dx2 = x4 - x3;
    const dy2 = y4 - y3;
    const dx3 = x1 - x3;
    const dy3 = y1 - y3;

    // s stores the distance along segment `other` where it would intersect the
    // line containing `this`.
    const s = (-dy2 * dx3 + dx1 * dy3) / (-dx2 * dy1 + dx1 * dy2);
    // t stores the distance along `this` where it would intsersect the line
    // containing `other`.
    const t = (dx2 * dy3 - dy2 * dx3) / (-dx2 * dy1 + dx1 * dy2);

    if (bounded(s, 0, 1) && bounded(t, 0, 1)) {
      // either s or t could be used to compute coordinates of the intersection
      const x = x1 + (t * dx1);
      const y = y1 + (t * dy1);
      return HexVector.fromAxialCoordinates(x, y);
    } else {
      // segments intersect at zero or infinitely many points; either way, we
      // can't handle it
      return null;
    }
  }

  /**
   * Compute overlap of grid-rounded segments.
   *
   * @remarks
   * Please don't use this for very long segments.
   */
  gridOverlap(other: HexSegment): HexVector[] {
    const path1 = this.start.cubicRound().pathTo(this.end.cubicRound());
    const path2 = other.start.cubicRound().pathTo(other.end.cubicRound());

    return path1.filter((v) => path2.includes(v));
  }
}
