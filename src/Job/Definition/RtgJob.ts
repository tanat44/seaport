import { Vector3 } from "three";
import { Container } from "../../StorageBlock/StorageBlock";
import { YardCoordinate } from "../../Yard/YardCoordinate";
import { JobBase } from "./JobBase";

export type RtgJobReason =
  | "rtgpickcontainerfromtruck"
  | "rtgdropcontainerinyard"
  | "rtgemptymove";
export abstract class RtgJob extends JobBase {
  rtgId: string;
  position: Vector3;
}

export class RtgEmptyMoveJob extends RtgJob {
  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "rtgemptymove";
  }
}

export class RtgPickContainerFromTruckJob extends RtgJob {
  truckId: string;
  yardCoordinate: YardCoordinate;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "rtgpickcontainerfromtruck";
  }
}

export class RtgDropContainerInYardJob extends RtgJob {
  container: Container;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "rtgdropcontainerinyard";
  }
}
