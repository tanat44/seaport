import { StorageBlock } from "../StorageBlock/StorageBlock";
import { StorageCoordinate } from "../StorageBlock/StorageCoordinate";

export type Cargo = {
  storage: StorageBlock;
  containerId: string;
  coordinate: StorageCoordinate;
};

export type CargoOrder = Cargo[];
