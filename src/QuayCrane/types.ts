import { Vector3 } from "three";
import { CargoCoordinate } from "../Terminal/CargoCoordinate";

export interface QuayCraneJob {
  position: Vector3;
  reason: "pickcontainerfromvessel" | "unloadcontaineronground";
}

export interface QuayCranePickContainerJob extends QuayCraneJob {
  reason: "pickcontainerfromvessel";
  cargoCoordinate: CargoCoordinate;
}
