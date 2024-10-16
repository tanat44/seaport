import { Vector2 } from "three";
import { GridCoordinate } from "./GridCoordinate";
import { GridDirection } from "./types";

export class GridPose extends GridCoordinate {
  direction: GridDirection;

  constructor(x: number, y: number, direction: GridDirection) {
    super(x, y);
    this.direction = direction;
  }

  equalTo(a: GridPose): boolean {
    return (
      Math.floor(this.x) === Math.floor(a.x) &&
      Math.floor(this.y) === Math.floor(a.y) &&
      this.direction === a.direction
    );
  }

  override get hash(): string {
    return `${this.x}-${this.y}-${this.direction}`;
  }

  get neighbors(): GridPose[] {
    const top = new GridPose(this.x, this.y + 1, "up");
    const left = new GridPose(this.x - 1, this.y, "left");
    const bottom = new GridPose(this.x, this.y - 1, "down");
    const right = new GridPose(this.x + 1, this.y, "right");

    if (this.direction === "up") return [right, top, left];
    else if (this.direction === "left") return [top, left, bottom];
    else if (this.direction === "down") return [left, bottom, right];

    return [bottom, right, top];
  }

  get nextGrid(): GridPose {
    if (this.direction === "up")
      return new GridPose(this.x, this.y + 1, this.direction);
    else if (this.direction === "left")
      return new GridPose(this.x - 1, this.y, this.direction);
    else if (this.direction === "down")
      return new GridPose(this.x, this.y - 1, this.direction);
    return new GridPose(this.x + 1, this.y, this.direction);
  }

  static hashToGridPose(hash: string) {
    const value = hash.split("-");
    return new GridPose(
      parseInt(value[0]),
      parseInt(value[1]),
      value[2] as GridDirection
    );
  }

  static poseToGridPose(
    pos: Vector2,
    direction: GridDirection,
    gridSize: number
  ): GridPose {
    return new GridPose(
      Math.floor(pos.x / gridSize),
      Math.floor(pos.y / gridSize),
      direction
    );
  }
}
