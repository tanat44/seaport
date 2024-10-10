import { Container } from "../../StorageBlock/StorageBlock";
import { JobBase } from "./JobBase";

export type HandoverJobReason = "handovercontainerqctotruck";

export abstract class HandoverJob extends JobBase {
  truckId: string;
}

export class HandoverContainerQcUnloadTruckLoad extends HandoverJob {
  qcId: string;
  container: Container;

  constructor(dependencies: number[]) {
    super(dependencies);
    this.reason = "handovercontainerqctotruck";
  }
}
