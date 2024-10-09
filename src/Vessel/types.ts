import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";

export type Cargo = {
  containerId: string;
  coordinate: StorageCoordinate;
};

export type CargoOrder = Cargo[];
