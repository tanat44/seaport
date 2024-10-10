import { Vector2 } from "three";
import { Container } from "../../StorageBlock/StorageBlock";
import { YardCoordinate } from "../../Yard/YardCoordinate";
import { JobBase } from "./JobBase";

export type TruckJobReason = "truckmovecontainertoyard" | "truckemptymove";
export abstract class TruckJob extends JobBase {
  truckId: string | undefined;
  to: Vector2;
}

export class TruckEmptyMoveJob extends TruckJob {
  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "truckemptymove";
  }
}

export class TruckContainerMoveToYardJob extends TruckJob {
  qcId: string;
  container: Container;
  yardCoordinate: YardCoordinate;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "truckmovecontainertoyard";
  }
}
