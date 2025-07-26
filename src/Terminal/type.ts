import { Cargo } from "../Vessel/types";
import { YardCoordinate } from "../Yard/YardCoordinate";

export type UnloadPlan = {
  qcId: string;
  cargo: Cargo;
  yardCoordinate: YardCoordinate;
};
