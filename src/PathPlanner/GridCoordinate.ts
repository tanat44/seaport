import { Vector2 } from "three";

export class GridCoordinate {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  equalTo(a: GridCoordinate): boolean {
    return (
      Math.floor(this.x) === Math.floor(a.x) &&
      Math.floor(this.y) === Math.floor(a.y)
    );
  }

  hash(): string {
    return `${this.x}-${this.y}`;
  }

  distanceTo(to: GridCoordinate): number {
    const dx = to.x - this.x;
    const dy = to.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  toVector2(gridSize: number): Vector2 {
    return new Vector2(this.x * gridSize, this.y * gridSize);
  }

  static fromHash(hash: string) {
    const value = hash.split("-");
    return new GridCoordinate(parseInt(value[0]), parseInt(value[1]));
  }

  static fromVector2(pos: Vector2, gridSize: number): GridCoordinate {
    return new GridCoordinate(
      Math.floor(pos.x / gridSize),
      Math.floor(pos.y / gridSize)
    );
  }
}
