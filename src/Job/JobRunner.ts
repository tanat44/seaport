import { JobStatusChangeEvent } from "../Event/JobEvent";
import { QcMoveEndEvent } from "../Event/QcEvent";
import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { Terminal } from "../Terminal/Terminal";
import { TruckManager } from "../Truck/TruckManager";
import { YardManager } from "../Yard/YardManager";
import { HandoverJob } from "./Definition/HanoverJob";
import { JobStatus } from "./Definition/JobBase";
import { JobSequence } from "./Definition/JobSequence";
import { QcJob, QcPickContainerFromVesselJob } from "./Definition/QcJob";
import { RtgJob, RtgPickContainerFromTruckJob } from "./Definition/RtgJob";
import { TruckJob } from "./Definition/TruckJob";
import { Handover } from "./Handover";
import { TerminalControl } from "./TerminalControl";

export class JobRunner extends TerminalControl {
  handover: Handover;
  jobSequences: JobSequence[];
  completedJobIds: Set<number>;

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
    this.completedJobIds = new Set();

    // register event handler
    this.terminal.visualizer.onEvent<JobStatusChangeEvent>(
      "jobstatuschange",
      (e) => this.onJobStatusChange(e)
    );
    this.terminal.visualizer.onEvent<QcMoveEndEvent>("qcmoveend", (e) =>
      this.onQcMoveEnd(e)
    );
  }

  run(jobs: JobSequence[]) {
    this.jobSequences = [jobs[0]];
    this.runSequence();
  }

  private runSequence() {
    if (this.completedJobIds.size === this.jobSequences.length) {
      console.log("JobRunner: all sequence completed");
      return;
    }
    for (const sequence of this.jobSequences) {
      if (sequence.completed) {
        this.completedJobIds.add(sequence.id);
        continue;
      }

      let someExecuteSuccess = false;
      for (const job of sequence.canStartJobs()) {
        if (QcJob.prototype.isPrototypeOf(job)) {
          someExecuteSuccess =
            someExecuteSuccess || this.qcManager.execute(job as QcJob);
        } else if (RtgJob.prototype.isPrototypeOf(job)) {
          const rtgJob = job as RtgJob;

          if (rtgJob.reason === "rtgpickcontainerfromtruck") {
          } else if (rtgJob.reason === "rtgdropcontainerinyard") {
            // unload container from truck
            const truckId = (rtgJob as RtgPickContainerFromTruckJob).truckId;
            const truck = this.truckManager.getTruck(truckId);
            const container = truck.unload();
            this.truckManager.releaseTruck(truckId);

            // load container to rtg
            const rtg = this.rtgManager.getRtg(rtgJob.rtgId);
            rtg.pickContainer(container);
          }

          someExecuteSuccess =
            someExecuteSuccess || this.rtgManager.execute(rtgJob);
        } else if (TruckJob.prototype.isPrototypeOf(job)) {
          const truckJob = job as TruckJob;
          if (truckJob.reason === "truckemptymove") {
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
          this.handover.execute(job);
          sequence.completeParentJob(job);
          job.status = JobStatus.Completed;
          this.runSequence();
          someExecuteSuccess = true;
        } else {
          throw new Error("Unknown job type");
        }
      }

      // console.log(sequence);

      if (!someExecuteSuccess) {
        console.log("JobRunner: depleted");
        return;
      }
    }
  }

  private onJobStatusChange(e: JobStatusChangeEvent) {
    if (
      e.job.status === JobStatus.Completed ||
      e.job.status === JobStatus.WaitForRelease
    )
      this.runSequence();
  }

  private onQcMoveEnd(e: QcMoveEndEvent) {
    const qc = this.qcManager.getQuayCrane(e.qcId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    if (e.job.reason === "qcpickcontainerfromvessel") {
      const job = e.job as QcPickContainerFromVesselJob;
      const vessel = this.qcManager.getAssignedVessel(e.qcId);
      const container = vessel.remove(job.cargoCoordinate);
      qc.pickContainer(container);
    }
    this.runSequence();
  }
}
