import { HandoverJob } from "./HanoverJob";
import { JobBase, JobStatus } from "./JobBase";
import { TruckJob } from "./TruckJob";

export type SequenceId = number;
export class JobSequence {
  id: SequenceId;
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
      } else if (HandoverJob.prototype.isPrototypeOf(job)) {
        (job as HandoverJob).truckId = truckId;
      }
    }
  }

  get completed(): boolean {
    for (const job of this.jobSequence) {
      if (job.status !== JobStatus.Completed) return false;
    }
    return true;
  }

  canStartJobs(): JobBase[] {
    if (this.completed) return [];
    const jobs = this.jobSequence.filter((job) => this.canStartJob(job));
    // console.log("can", jobs);
    return jobs;
  }

  completeParentJob(job: JobBase) {
    for (const parentId of job.dependencies) {
      const parentJob = this.findJob(parentId);
      parentJob.status = JobStatus.Completed;
    }
  }

  private canStartJob(job: JobBase) {
    if (job.status !== JobStatus.NotStarted) return false;

    for (const parentId of job.dependencies) {
      const parentJob = this.findJob(parentId);
      if (
        parentJob.status === JobStatus.Completed ||
        parentJob.status === JobStatus.WaitForRelease
      )
        continue;
      return false;
    }
    return true;
  }

  findJob(id: number): JobBase | undefined {
    return this.jobSequence.findLast((job) => job.id === id);
  }
}
