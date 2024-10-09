import { JobBase } from "./JobBase";
import { TruckJob } from "./TruckJob";

export class JobSequence {
  id: number;
  containerId: string;
  jobSequence: JobBase[];

  private static count = 0;

  constructor(containerId: string) {
    this.id = JobSequence.count++;
    this.containerId = containerId;
    this.jobSequence = [];
  }

  addJob(job: JobBase) {
    job.sequenceId = this.id;
    this.jobSequence.push(job);
  }

  assignTruck(truckId: string) {
    for (const job of this.jobSequence) {
      if (TruckJob.prototype.isPrototypeOf(job)) {
        (job as TruckJob).truckId = truckId;
      }
    }
  }

  get completed(): boolean {
    for (const job of this.jobSequence) {
      if (!job.completed) return false;
    }
    return true;
  }

  canStartJobs(): JobBase[] {
    if (this.completed) return [];
    return this.jobSequence.filter((job) => this.canStartJob(job));
  }

  private canStartJob(job: JobBase) {
    for (const parentId of job.dependencies) {
      const parentJob = this.findJob(parentId);
      if (!parentJob.completed) return false;
    }
    return true;
  }

  findJob(id: number): JobBase | undefined {
    return this.jobSequence.findLast((job) => job.id === id);
  }
}
