import { Vector2 } from "three";
import { Container } from "../../StorageBlock/StorageBlock";
import { YardCoordinate } from "../../Yard/YardCoordinate";
import { JobBase } from "./JobBase";

export type TruckJobReason =
  | "truckmove"
  | "truckmovecontainertoyard"
  | "truckmovetounderqc"
  | "truckmovetoqcstandby";
export abstract class TruckJob extends JobBase {
  to: Vector2;
  truckId: string | undefined;

  constructor(dependencies: number[], to: Vector2) {
    super(dependencies);
    this.to = to;
  }
}

export class TruckMoveJob extends TruckJob {
  constructor(dependencies: number[], to: Vector2) {
    super(dependencies, to);
    this.reason = "truckmove";
  }
}

export class TruckMoveToQcStandby extends TruckJob {
  constructor(dependencies: number[], to: Vector2) {
    super(dependencies, to);
    this.reason = "truckmovetoqcstandby";
  }
}

export class TruckMoveToUnderQcJob extends TruckJob {
  constructor(dependencies: number[], to: Vector2) {
    super(dependencies, to);
    this.reason = "truckmovetounderqc";
  }
}

export class TruckMoveContainerToYardJob extends TruckJob {
  qcId: string;
  yardCoordinate: YardCoordinate;
  container: Container | undefined;

  constructor(
    dependencies: number[],
    to: Vector2,
    qcId: string,
    yardCoordinate: YardCoordinate
  ) {
    super(dependencies, to);
    this.reason = "truckmovecontainertoyard";
    this.qcId = qcId;
    this.yardCoordinate = yardCoordinate;
  }
}
