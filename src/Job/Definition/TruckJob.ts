import { Vector2 } from "three";
import { Container } from "../../StorageBlock/StorageBlock";
import { YardCoordinate } from "../../Yard/YardCoordinate";
import { JobBase } from "./JobBase";

export type TruckJobReason = "truckmovecontainertoyard" | "truckmovetounderqc";
export abstract class TruckJob extends JobBase {
  truckId: string | undefined;
  to: Vector2;
}

export class TruckMoveToUnderQcJob extends TruckJob {
  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "truckmovetounderqc";
  }
}

export class TruckMoveContainerToYardJob extends TruckJob {
  qcId: string;
  container: Container;
  yardCoordinate: YardCoordinate;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "truckmovecontainertoyard";
  }
}
