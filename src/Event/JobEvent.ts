import { JobBase } from "../Job/Definition/JobBase";
import { JobSequence } from "../Job/Definition/JobSequence";
import { EventBase } from "./types";

export type JobEventType = "jobstatuschange" | "jobsequencestatuschange";

export class JobStatusChangeEvent extends EventBase {
  job: JobBase;

  constructor(job: JobBase) {
    super("jobstatuschange");
    this.job = job;
  }
}

export class JobSequenceStatusChangeEvent extends EventBase {
  sequence: JobSequence;

  constructor(sequence: JobSequence) {
    super("jobsequencestatuschange");
    this.sequence = sequence;
  }
}
