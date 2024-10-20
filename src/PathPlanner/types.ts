import { GridPose } from "./GridPose";

export enum CellType {
  UnderQuayCrane = "qc",
  Road = "road",
  Yard = "yard",
}

export type GridDirection = "up" | "left" | "down" | "right";

export type Grid = CellType[][];

export type GridPath = GridPose[];
