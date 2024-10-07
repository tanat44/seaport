import { Vector3 } from "three";
import { Container } from "../StorageBlock/StorageBlock";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";

export interface QuayCraneJob {
  position: Vector3;
  reason: "pickcontainerfromvessel" | "dropcontainertotruck";
}

export interface QuayCranePickContainerFromVesselJob extends QuayCraneJob {
  reason: "pickcontainerfromvessel";
  cargoCoordinate: StorageCoordinate;
  containerId: string;
}

export interface QuayCraneDropContainerToTruckJob extends QuayCraneJob {
  reason: "dropcontainertotruck";
  container: Container | undefined;
  truckId: string | undefined;
}
