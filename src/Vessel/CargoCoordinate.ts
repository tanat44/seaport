import { Vector3 } from "three";
import {
  CONTAINER_SIZE_X,
  CONTAINER_SIZE_Y,
  CONTAINER_SIZE_Z,
} from "../Terminal/const";

export class CargoCoordinate {
  bay: number;
  column: number;
  height: number;
  constructor(bay: number, column: number, height: number) {
    this.bay = bay;
    this.column = column;
    this.height = height;
  }

  get relativePosition(): Vector3 {
    return new Vector3(
      this.bay * CONTAINER_SIZE_X + CONTAINER_SIZE_X / 2,
      this.column * CONTAINER_SIZE_Y + CONTAINER_SIZE_Y / 2,
      this.height * CONTAINER_SIZE_Z + CONTAINER_SIZE_Z / 2
    );
  }
}
