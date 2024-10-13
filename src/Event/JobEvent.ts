import { JobBase } from "../Job/Definition/JobBase";
import { JobSequence } from "../Job/Definition/JobSequence";
import { EventBase } from "./types";

export type JobEventType =
  | "jobstatuschange"
  | "jobsequencestart"
  | "jobsequencecomplete";

export class JobStatusChangeEvent extends EventBase {
  job: JobBase;

  constructor(job: JobBase) {
    super("jobstatuschange");
    this.job = job;
  }
}

export class JobSequenceStartEvent extends EventBase {
  sequence: JobSequence;

  constructor(sequence: JobSequence) {
    super("jobsequencestart");
    this.sequence = sequence;
  }
}

export class JobSequenceCompleteEvent extends EventBase {
  sequence: JobSequence;

  constructor(sequence: JobSequence) {
    super("jobsequencecomplete");
    this.sequence = sequence;
  }
}
