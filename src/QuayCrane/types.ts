import { Vector3 } from "three";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";

export interface QuayCraneJob {
  position: Vector3;
  reason: "pickcontainerfromvessel" | "unloadcontaineronground";
}

export interface QuayCranePickContainerJob extends QuayCraneJob {
  reason: "pickcontainerfromvessel";
  cargoCoordinate: StorageCoordinate;
}
