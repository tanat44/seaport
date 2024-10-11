import { JobBase } from "../Job/Definition/JobBase";
import { EventBase } from "./types";

export type JobEventType = "jobstatuschange";

export class JobStatusChangeEvent extends EventBase {
  job: JobBase;

  constructor(job: JobBase) {
    super("jobstatuschange");
    this.job = job;
  }
}
