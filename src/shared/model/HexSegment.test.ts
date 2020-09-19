import { HexVector, HEX_DIRECTIONS } from "./HexVector";

import { HexSegment } from "./HexSegment";

describe("HexSegment.intersection()", () => {
  it("case 1 (y=0, x=0)", () => {
    const s1 = new HexSegment(
      HexVector.fromAxialCoordinates(-10, 0),
      HexVector.fromAxialCoordinates(10, 0)
    );

    const s2 = new HexSegment(
      HexVector.fromAxialCoordinates(0, 10),
      HexVector.fromAxialCoordinates(0, -10)
    );

    expect(s1.intersection(s2)?.toString()).toMatchInlineSnapshot(
      `"HexVector(a, 0, 0)"`
    );
  });

  it("case 2", () => {
    const s1 = new HexSegment(
      HexVector.fromAxialCoordinates(-1, 0),
      HexVector.fromAxialCoordinates(10, 10)
    );

    const s2 = new HexSegment(
      HexVector.fromAxialCoordinates(0, 1),
      HexVector.fromAxialCoordinates(0, -10)
    );

    expect(s1.intersection(s2)?.toString()).toMatchInlineSnapshot(
      `"HexVector(a, 0, 0.9090909090909092)"`
    );
  });

  it("case 3", () => {
    const s1 = new HexSegment(
      HexVector.fromAxialCoordinates(0, -10),
      HexVector.fromAxialCoordinates(0, 10)
    );

    const s2 = new HexSegment(
      HexVector.fromAxialCoordinates(0.00001, -2),
      HexVector.fromAxialCoordinates(-0.0001, 11)
    );

    expect(s1.intersection(s2)?.toString()).toMatchInlineSnapshot(
      `"HexVector(a, 0, -0.8181818181818183)"`
    );
  });

  it("case 4 (overlapping segments)", () => {
    const s1 = new HexSegment(
      HexVector.fromAxialCoordinates(-2, 0),
      HexVector.fromAxialCoordinates(1, 0)
    );

    const s2 = new HexSegment(
      HexVector.fromAxialCoordinates(0, 0),
      HexVector.fromAxialCoordinates(2, 0)
    );

    expect(s1.intersection(s2)).toMatchInlineSnapshot(`null`);
  });
});

describe("HexSegment.boundingBox()", () => {
  const s = new HexSegment(
    HexVector.fromAxialCoordinates(-10, 10),
    HexVector.fromAxialCoordinates(10, -10)
  );

  expect(s.boundingBox()).toMatchInlineSnapshot(`
    BoxRegion {
      "xMax": 10,
      "xMin": -10,
      "yMax": 10,
      "yMin": -10,
    }
  `);
});
