import { Vector3 } from "three";
import { StorageCoordinate } from "../../StorageBlock/StorageCoordinate";
import { JobBase } from "./JobBase";

export abstract class QcJob extends JobBase {
  qcId: string;
  position: Vector3;
  reason: "qcpickcontainerfromvessel" | "qcdropcontainertotruck";
}

export class QcPickContainerFromVesselJob extends QcJob {
  cargoCoordinate: StorageCoordinate;
  truckId: string | undefined;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "qcpickcontainerfromvessel";
  }
}

export class QcDropContainerToTruckJob extends QcJob {
  truckId: string | undefined;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "qcdropcontainertotruck";
  }
}
