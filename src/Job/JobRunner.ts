import {
  JobSequenceStatusChangeEvent,
  JobStatusChangeEvent,
} from "../Event/JobEvent";
import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { Terminal } from "../Terminal/Terminal";
import { TruckManager } from "../Truck/TruckManager";
import { YardManager } from "../Yard/YardManager";
import { HandoverJob } from "./Definition/HanoverJob";
import { JobStatus } from "./Definition/JobBase";
import { JobSequence, SequenceStatus } from "./Definition/JobSequence";
import { QcJob } from "./Definition/QcJob";
import { RtgJob } from "./Definition/RtgJob";
import { TruckJob } from "./Definition/TruckJob";
import { Handover } from "./Handover";
import { TerminalControl } from "./TerminalControl";

export class JobRunner extends TerminalControl {
  handover: Handover;
  jobSequences: JobSequence[];
  completeSequences: JobSequence[];

  constructor(
    terminal: Terminal,
    qcManager: QcManager,
    rtgManager: RtgManager,
    truckManager: TruckManager,
    yardManager: YardManager
  ) {
    super(terminal, qcManager, rtgManager, truckManager, yardManager);

    this.handover = new Handover(
      terminal,
      qcManager,
      rtgManager,
      truckManager,
      yardManager
    );
    this.jobSequences = [];
    this.completeSequences = [];

    // register event handler
    this.terminal.visualizer.onEvent<JobStatusChangeEvent>(
      "jobstatuschange",
      (e) => this.onJobStatusChange(e)
    );
    this.terminal.visualizer.onEvent<JobSequenceStatusChangeEvent>(
      "jobsequencestatuschange",
      (e) => this.onJobSequenceStatusChange(e)
    );
  }

  run(jobs: JobSequence[]) {
    this.jobSequences = jobs;
    this.runSequence();
  }

  private runSequence() {
    if (this.jobSequences.length === 0) {
      console.log("JobRunner: all sequence completed");
      return;
    }

    let i = 0;
    while (i < this.jobSequences.length) {
      const sequence = this.jobSequences[i];
      if (sequence.isAllJobsCompleted) {
        sequence.updateStatus(
          SequenceStatus.Complete,
          this.terminal.visualizer
        );
        const removeSequences = this.jobSequences.splice(i, 1);
        this.completeSequences.push(...removeSequences);
        continue;
      }

      let someExecuteSuccess = false;
      for (const job of sequence.canStartJobs()) {
        if (QcJob.prototype.isPrototypeOf(job)) {
          someExecuteSuccess =
            someExecuteSuccess || this.qcManager.execute(job as QcJob);
        } else if (RtgJob.prototype.isPrototypeOf(job)) {
          someExecuteSuccess =
            someExecuteSuccess || this.rtgManager.execute(job as RtgJob);
        } else if (TruckJob.prototype.isPrototypeOf(job)) {
          const truckJob = job as TruckJob;
          if (truckJob.reason === "truckmovetounderqc") {
            const truck = this.truckManager.getAvailableTruck(truckJob.to);
            if (truck) {
              sequence.assignTruck(truck.id);
              this.truckManager.execute(truckJob);
              someExecuteSuccess = true;
            }
          } else if (truckJob.reason === "truckmovecontainertoyard") {
            this.truckManager.execute(truckJob);
            someExecuteSuccess = true;
          }
        } else if (HandoverJob.prototype.isPrototypeOf(job)) {
          this.handover.execute(job, sequence);
          someExecuteSuccess = true;
        } else {
          throw new Error("Unknown job type");
        }
      }

      if (someExecuteSuccess) {
        if (sequence.status === SequenceStatus.NotStarted)
          sequence.updateStatus(
            SequenceStatus.Working,
            this.terminal.visualizer
          );
      }

      ++i;
    }
  }

  private onJobStatusChange(e: JobStatusChangeEvent) {
    // console.log(e.job.toString(), e.job.status);
    if (
      e.job.status === JobStatus.Completed ||
      e.job.status === JobStatus.WaitForRelease
    )
      this.runSequence();
  }

  private onJobSequenceStatusChange(e: JobSequenceStatusChangeEvent) {
    const sequence = e.sequence;

    if (sequence.status === SequenceStatus.Complete) {
      const totalJobs =
        this.jobSequences.length + this.completeSequences.length;
      console.log(
        `JobRunner: Remaining ${this.jobSequences.length}/${totalJobs} sequences`
      );
    }
  }
}
