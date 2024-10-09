import { JobBase } from "../Event/types";

export class ContainerJob {
  containerId: string;
  jobSequence: JobBase[];

  constructor(containerId: string) {
    this.containerId = containerId;
    this.jobSequence = [];
  }

  addJob(job: JobBase) {
    this.jobSequence.push(job);
  }
}
