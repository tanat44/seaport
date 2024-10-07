import { Vector2 } from "three";
import { Container } from "../StorageBlock/StorageBlock";
import { YardCoordinate } from "../Yard/YardCoordinate";

export interface TruckJob {
  truckId: string;
  controlPoints: Vector2[];
  reason: "movecontainertoyard" | "emptymove";
}

export interface TruckEmptyMoveJob extends TruckJob {
  reason: "emptymove";
}

export interface TruckContainerMoveToYardJob extends TruckJob {
  reason: "movecontainertoyard";
  container: Container;
  yardCoordinate: YardCoordinate;
}
