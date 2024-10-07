import { Vector3 } from "three";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";

export interface QcJob {
  position: Vector3;
  reason: "qcpickcontainerfromvessel" | "qcdropcontainertotruck";
}

export interface QcPickContainerFromVesselJob extends QcJob {
  reason: "qcpickcontainerfromvessel";
  cargoCoordinate: StorageCoordinate;
  truckId: string | undefined;
}

export interface QcDropContainerToTruckJob extends QcJob {
  reason: "qcdropcontainertotruck";
  truckId: string | undefined;
}
