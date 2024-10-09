import { Vector3 } from "three";
import { JobBase } from "../Event/types";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";

export abstract class QcJob extends JobBase {
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
