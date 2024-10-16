import { Box2, Vector2, Vector3 } from "three";
import { GridPose } from "./GridPose";

export type Layout = {
  terminalSize: Vector2;
  quayCraneOrigins: Vector3[];
  yardSpaces: Box2[];
};

export enum CellType {
  UnderQuayCrane = "qc",
  Road = "road",
  Yard = "yard",
}

export type GridDirection = "up" | "left" | "down" | "right";

export type Grid = CellType[][];

export type GridPath = GridPose[];
