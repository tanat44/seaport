import { Vector3 } from "three";
import { StorageCoordinate } from "../../StorageBlock/StorageCoordinate";
import { JobBase } from "./JobBase";

export type QcJobReason =
  | "qcpickcontainerfromvessel"
  | "qcstandbyovertruck"
  | "qcdropcontainertotruck";
export abstract class QcJob extends JobBase {
  qcId: string;
  position: Vector3;

  constructor(dependencies: number[], qcId: string, position: Vector3) {
    super(dependencies);
    this.qcId = qcId;
    this.position = position;
  }
}

export class QcPickContainerFromVesselJob extends QcJob {
  cargoCoordinate: StorageCoordinate;
  truckId: string | undefined;

  constructor(
    dependencies: number[],
    qcId: string,
    position: Vector3,
    cargoCoordinate: StorageCoordinate
  ) {
    super(dependencies, qcId, position);
    this.reason = "qcpickcontainerfromvessel";
    this.cargoCoordinate = cargoCoordinate;
  }
}

export class QcStandbyOverTruckJob extends QcJob {
  constructor(dependencies: number[], qcId: string, position: Vector3) {
    super(dependencies, qcId, position);
    this.reason = "qcstandbyovertruck";
  }
}

export class QcDropContainerToTruckJob extends QcJob {
  truckId: string | undefined;

  constructor(dependencies: number[], qcId: string, position: Vector3) {
    super(dependencies, qcId, position);
    this.reason = "qcdropcontainertotruck";
  }
}
