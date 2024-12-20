import { EquipmentId } from "../Event/EquipmentEvent";
import { GridPose } from "./GridPose";

export type CellType = "road" | "yard" | EquipmentId;

export type GridDirection = "up" | "left" | "down" | "right";

export type GridMap = CellType[][];

export type GridPath = GridPose[];
