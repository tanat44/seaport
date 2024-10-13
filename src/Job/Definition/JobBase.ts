import { JobStatusChangeEvent } from "../../Event/JobEvent";
import { Visualizer } from "../../Visualizer/Visualizer";
import { HandoverJobReason } from "./HanoverJob";
import { QcJobReason } from "./QcJob";
import { RtgJobReason } from "./RtgJob";
import { TruckJobReason } from "./TruckJob";

export enum JobStatus {
  NotStarted = "NotStarted",
  Working = "Working",
  WaitForRelease = "WaitForRelease",
  Completed = "Completed",
}
export abstract class JobBase {
  private static count = 0;
  id: number;
  sequenceId: number | undefined;
  dependencies: number[];
  status: JobStatus;
  reason: QcJobReason | RtgJobReason | TruckJobReason | HandoverJobReason;

  constructor(dependencies: number[]) {
    this.id = JobBase.count++;
    this.dependencies = [...dependencies];
    this.status = JobStatus.NotStarted;
  }

  toString() {
    return `<${this.reason}.${this.sequenceId ?? "?"}.${this.id}>`;
  }

  updateStatus(status: JobStatus, visualizer: Visualizer) {
    if (this.status === JobStatus.Completed) {
      throw new Error(
        "Cannot update job status when job has already completed"
      );
    }

    this.status = status;
    visualizer.emit(new JobStatusChangeEvent(this));
  }
}
