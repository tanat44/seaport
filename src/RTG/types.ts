import { Vector3 } from "three";
import { Container } from "../StorageBlock/StorageBlock";
import { YardCoordinate } from "../Yard/YardCoordinate";

export interface RtgJob {
  rtgId: string;
  position: Vector3;
  reason: "pickcontainerfromtruck" | "dropcontainerinyard" | "emptymove";
}

export interface RtgEmptyMoveJob extends RtgJob {
  reason: "emptymove";
}

export interface RtgPickContainerFromTruckJob extends RtgJob {
  reason: "pickcontainerfromtruck";
  truckId: string;
  yardCoordinate: YardCoordinate;
}

export interface RtgDropContainerInYardJob extends RtgJob {
  reason: "dropcontainerinyard";
  container: Container;
}
