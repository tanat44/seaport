import { JobSequenceCompleteEvent } from "../../Event/JobEvent";
import { Visualizer } from "../../Visualizer/Visualizer";
import { HandoverJob } from "./HanoverJob";
import { JobBase, JobStatus } from "./JobBase";
import { TruckJob } from "./TruckJob";

export type SequenceId = number;

export enum SequenceStatus {
  NotStarted,
  Working,
  Complete,
}
export class JobSequence {
  id: SequenceId;
  containerId: string;
  jobs: JobBase[];
  status: SequenceStatus;

  private static count = 0;

  constructor(containerId: string) {
    this.id = JobSequence.count++;
    this.containerId = containerId;
    this.jobs = [];
  }

  addJob(job: JobBase) {
    job.sequenceId = this.id;
    this.jobs.push(job);
  }

  assignTruck(truckId: string) {
    for (const job of this.jobs) {
      if (TruckJob.prototype.isPrototypeOf(job)) {
        (job as TruckJob).truckId = truckId;
      } else if (HandoverJob.prototype.isPrototypeOf(job) && "truckId" in job) {
        job.truckId = truckId;
      }
    }
  }

  get completed(): boolean {
    for (const job of this.jobs) {
      if (job.status !== JobStatus.Completed) return false;
    }
    return true;
  }

  canStartJobs(): JobBase[] {
    if (this.completed) return [];
    const jobs = this.jobs.filter((job) => this.canStartJob(job));
    // console.log("can", jobs);
    return jobs;
  }

  completeParentJob(job: JobBase) {
    for (const parentId of job.dependencies) {
      const parentJob = this.findJob(parentId);
      if (parentJob.status === JobStatus.NotStarted)
        throw new Error("Trying to complete NotStart parent job");
      else if (parentJob.status === JobStatus.Working)
        throw new Error("Trying to complete Working parent job");
      else if (parentJob.status === JobStatus.Completed) continue;

      parentJob.status = JobStatus.Completed;
    }
  }

  updateStatus(status: SequenceStatus, visualizer: Visualizer) {
    if (this.status === SequenceStatus.Complete)
      throw new Error("Cannot update status of completed job sequence");

    if (status === SequenceStatus.Complete && !this.isAllJobsCompleted) {
      throw new Error(
        "Cannot complete sequence. Some job is still not completed"
      );
    }

    this.status = status;
    visualizer.emit(new JobSequenceCompleteEvent(this));
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

  private findJob(id: number): JobBase | undefined {
    return this.jobs.findLast((job) => job.id === id);
  }

  private isAllJobsCompleted(): boolean {
    for (const job of this.jobs) {
      if (job.status !== JobStatus.Completed) return false;
    }
    return true;
  }
}
