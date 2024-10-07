import { Vector2 } from "three";
import { Container } from "../StorageBlock/StorageBlock";
import { YardCoordinate } from "../Yard/YardCoordinate";

export interface TruckJob {
  truckId: string;
  controlPoints: Vector2[];
  reason: "truckmovecontainertoyard" | "truckemptymove";
}

export interface TruckEmptyMoveJob extends TruckJob {
  reason: "truckemptymove";
}

export interface TruckContainerMoveToYardJob extends TruckJob {
  reason: "truckmovecontainertoyard";
  container: Container;
  yardCoordinate: YardCoordinate;
}
