import { Box2, Vector2, Vector3 } from "three";
import { GridCoordinate } from "./GridCoordinate";

export type Layout = {
  terminalSize: Vector2;
  quayCraneOrigins: Vector3[];
  yardBlocks: Box2[];
};

export enum CellType {
  UnderQuayCrane = "qc",
  Drivable = "drivable",
  Yard = "yard",
}

export type Grid = CellType[][];

export type GridPath = GridCoordinate[];
