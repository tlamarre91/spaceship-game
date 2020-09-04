import {
  HexVector,
  HEX_DIRECTIONS
} from "./HexVector";

const box = {
  xMin: -1000,
  xMax: 1000,
  yMin: -1000,
  yMax: 1000,
};

describe("HexVector (basic)", () => {
  it("validates cubic coordinates", () => {
    const f = () => {
      const v = HexVector.fromCubicCoordinates(4, 2, 2341);
    };

    expect(f).toThrowError("invalid cubic coordinates: (4, 2, 2341)");
  });

  it("HexVector.EPSILON is considered equal to HexVector.ZERO", () => {
    const v = HexVector.EPSILON_CUBIC;
    const w = HexVector.ZERO;
    expect(v.equals(w)).toBeTruthy();
    expect(w.equals(v)).toBeTruthy();
  });

  it("HexVectors with different coordinates are not equal", () => {
    const v = new HexVector("a", 0.0003, 0.0005);
    const w = new HexVector("a", 0.0005, 0.0003);
    expect(v.equals(w)).toBeFalsy();
  });

  it("different HexVectors are not equal", () => {
    HEX_DIRECTIONS.forEach((dir) => {
      const v = HexVector.direction(dir);
      expect(v.equals(HexVector.ZERO)).toBeFalsy();
    });
  });

  it("HexVector equals itself", () => {
    const v = new HexVector("c", 30, 40, -70);
    expect(v.equals(v)).toBeTruthy();
  });

  it("HexVector equals its equivalent in the other system", () => {
    const v = new HexVector("c", 30, 40, -70);
    const w = new HexVector("a", 30, 40);
    expect(v.equals(w)).toBeTruthy();
    expect(w.equals(v)).toBeTruthy();
  });

  it("adds axial", () => {
    const v = HexVector.fromAxialCoordinates(5, 2);
    const w = HexVector.fromAxialCoordinates(43, 2);
    expect(v.plus(w).equals(w.plus(v))).toBeTruthy();
    expect(v.plus(w)).toMatchInlineSnapshot(`
      HexVector {
        "system": "a",
        "x": 48,
        "y": 4,
        "z": null,
      }
    `);
  });

  it("adds cubic", () => {
    const v = HexVector.fromCubicCoordinates(5, -2, -3);
    const w = HexVector.fromCubicCoordinates(233, 7, -240);
    expect(v.plus(w).equals(w.plus(v))).toBeTruthy();
    expect(v.plus(w)).toMatchInlineSnapshot(`
      HexVector {
        "system": "c",
        "x": 238,
        "y": 5,
        "z": -243,
      }
    `);
  });
});

describe("HexVector (randomized)", () => {
  it("equals itself", () => {
    const v = HexVector.random(box);
    expect(v.equals(v)).toBeTruthy();
  });

  it("adds axial", () => {
    const v = HexVector.random(box);
    const w = HexVector.random(box);

    const { x: x0, y: y0 } = v;
    const { x: x1, y: y1 } = w;

    const sum = v.plus(w);
    expect(sum.x).toBe(x0 + x1);
    expect(sum.y).toBe(y0 + y1);
  });

  it("adds cubic", () => {
    const v = HexVector.random(box).toCubic();
    const w = HexVector.random(box).toCubic();

    const { x: x0, y: y0, z: z0 } = v;
    const { x: x1, y: y1, z: z1 } = w;

    const sum = v.plus(w);
    expect(sum.x).toBe(x0 + x1);
    expect(sum.y).toBe(y0 + y1);
    expect(sum.z).toBe(z0 + z1);
  });
});

describe("HexVector (methods)", () => {
  it.skip("pathTo() generates a grid path between two vectors", () => {
  });
});
