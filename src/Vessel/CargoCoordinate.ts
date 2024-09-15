import { Vector3 } from "three";
import {
  CONTAINER_SIZE_X,
  CONTAINER_SIZE_Y,
  CONTAINER_SIZE_Z,
} from "../Terminal/const";

export class CargoCoordinate {
  bay: number;
  row: number;
  tier: number;
  constructor(bay: number, row: number, tier: number) {
    this.bay = bay;
    this.row = row;
    this.tier = tier;
  }

  get relativePosition(): Vector3 {
    return new Vector3(
      this.bay * CONTAINER_SIZE_X + CONTAINER_SIZE_X / 2,
      this.row * CONTAINER_SIZE_Y + CONTAINER_SIZE_Y / 2,
      this.tier * CONTAINER_SIZE_Z + CONTAINER_SIZE_Z / 2
    );
  }
}
