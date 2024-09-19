import { Vector3 } from "three";
import { Container } from "../StorageBlock/StorageBlock";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";

export interface QuayCraneJob {
  position: Vector3;
  reason: "pickcontainer" | "dropcontainer";
}

export interface QuayCranePickContainerJob extends QuayCraneJob {
  reason: "pickcontainer";
  cargoCoordinate: StorageCoordinate;
  containerId: string;
}

export interface QuayCraneDropContainer extends QuayCraneJob {
  reason: "dropcontainer";
  container: Container;
}
