import { Box2, Vector2 } from "three";

export class GridBox {
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;

  constructor(minx: number, miny: number, maxx: number, maxy: number) {
    this.minx = minx;
    this.miny = miny;
    this.maxx = maxx;
    this.maxy = maxy;
  }

  equal(box: GridBox) {
    return (
      this.minx === box.minx &&
      this.miny === box.miny &&
      this.maxx === box.maxx &&
      this.maxy === box.maxy
    );
  }

  toBox2(scale: number): Box2 {
    return new Box2(
      new Vector2(this.minx * scale, this.miny * scale),
      new Vector2(this.maxx * scale, this.maxy * scale)
    );
  }
}
