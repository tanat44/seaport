import { Container } from "../../StorageBlock/StorageBlock";
import { StorageCoordinate } from "../../StorageBlock/StorageCoordinate";
import { JobBase } from "./JobBase";

export type HandoverJobReason =
  | "handovervesseltoqc"
  | "handoverqctotruck"
  | "handovertrucktortg"
  | "handoverrtgtoyard";

export abstract class HandoverJob extends JobBase {}

export class HandoverVesselToQcJob extends HandoverJob {
  cargoCoordinate: StorageCoordinate;
  qcId: string;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "handovervesseltoqc";
  }
}
export class HandoverQcToTruckJob extends HandoverJob {
  qcId: string;
  truckId: string;
  container: Container;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "handoverqctotruck";
  }
}

export class HandoverTruckToRtgJob extends HandoverJob {
  truckId: string;
  rtgId: string;
  container: Container;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "handovertrucktortg";
  }
}

export class HandoverRtgToYardJob extends HandoverJob {
  rtgId: string;
  yardId: string;
  container: Container;
  yardCoordinate: StorageCoordinate;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "handoverrtgtoyard";
  }
}
