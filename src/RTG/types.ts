import { Vector3 } from "three";
import { Container } from "../StorageBlock/StorageBlock";
import { YardCoordinate } from "../Yard/YardCoordinate";

export interface RtgJob {
  rtgId: string;
  position: Vector3;
  reason:
    | "rtgpickcontainerfromtruck"
    | "rtgdropcontainerinyard"
    | "rtgemptymove";
}

export interface RtgEmptyMoveJob extends RtgJob {
  reason: "rtgemptymove";
}

export interface RtgPickContainerFromTruckJob extends RtgJob {
  reason: "rtgpickcontainerfromtruck";
  truckId: string;
  yardCoordinate: YardCoordinate;
}

export interface RtgDropContainerInYardJob extends RtgJob {
  reason: "rtgdropcontainerinyard";
  container: Container;
}
