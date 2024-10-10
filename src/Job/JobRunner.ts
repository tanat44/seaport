import {
  QcJobFinishEvent,
  QcMoveEndEvent,
  RtgMoveEndEvent,
  TruckDriveEndEvent,
} from "../Event/types";
import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { Terminal } from "../Terminal/Terminal";
import { TruckManager } from "../Truck/TruckManager";
import { YardManager } from "../Yard/YardManager";
import {
  HandoverContainerQcUnloadTruckLoad,
  HandoverJob,
} from "./Definition/HanoverJob";
import { JobStatus } from "./Definition/JobBase";
import { JobSequence } from "./Definition/JobSequence";
import { QcJob, QcPickContainerFromVesselJob } from "./Definition/QcJob";
import { RtgJob, RtgPickContainerFromTruckJob } from "./Definition/RtgJob";
import { TruckJob } from "./Definition/TruckJob";

export class JobRunner {
  terminal: Terminal;
  qcManager: QcManager;
  rtgManager: RtgManager;
  truckManager: TruckManager;
  yardManager: YardManager;

  jobSequences: JobSequence[];
  completedJobIds: Set<number>;

  constructor(
    terminal: Terminal,
    qcManager: QcManager,
    rtgManager: RtgManager,
    truckManager: TruckManager,
    yardManager: YardManager
  ) {
    this.terminal = terminal;
    this.qcManager = qcManager;
    this.rtgManager = rtgManager;
    this.truckManager = truckManager;
    this.yardManager = yardManager;

    this.jobSequences = [];
    this.completedJobIds = new Set();

    // register event handler
    this.terminal.visualizer.onEvent<QcMoveEndEvent>("qcmoveend", (e) =>
      this.onQcMoveEnd(e)
    );
    this.terminal.visualizer.onEvent<RtgMoveEndEvent>("rtgmoveend", (e) =>
      this.onRtgMoveEnd(e)
    );
    this.terminal.visualizer.onEvent<TruckDriveEndEvent>("truckdriveend", (e) =>
      this.onTruckDriveEnd(e)
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
          if (job.reason === "handovercontainerqctotruck") {
            console.log("Handover");
            const handoverJob = job as HandoverContainerQcUnloadTruckLoad;

            // qc drop container
            const qc = this.qcManager.getQuayCrane(handoverJob.qcId);
            const container = qc.dropContainer();
            this.qcManager.releaseQc(qc.id);

            // truck load container
            const truck = this.truckManager.getTruck(handoverJob.truckId);
            truck.load(container);

            sequence.completeParentJob(job);
            job.status = JobStatus.Completed;

            this.runSequence();
          }
        } else {
          throw new Error("Unknown job type");
        }
      }

      console.log(sequence);

      if (!someExecuteSuccess) {
        console.log("JobRunner: resource depleted wait for next chance");
        return;
      }
    }
  }

  private onQcMoveEnd(e: QcJobFinishEvent) {
    // console.log(`QC#${e.quayCraneId} - Finished <${e.job.reason}>`);
    const qc = this.qcManager.getQuayCrane(e.qcId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    if (e.job.reason === "qcpickcontainerfromvessel") {
      const job = e.job as QcPickContainerFromVesselJob;
      const vessel = this.qcManager.getAssignedVessel(e.qcId);
      const container = vessel.unload(job.cargoCoordinate);
      qc.pickContainer(container);
    }
    this.runSequence();
  }

  private onRtgMoveEnd(e: RtgMoveEndEvent) {
    const rtg = this.rtgManager.getRtg(e.rtgId);
    if (e.job.reason === "rtgpickcontainerfromtruck") {
      const job = e.job as RtgPickContainerFromTruckJob;

      // unload container
      const truck = this.truckManager.getTruck(job.truckId);
      if (!truck) throw new Error("Rtg move to truck but cannot find truck");
      const container = truck.unload();
      rtg.pickContainer(container);

      // release truck
      this.truckManager.releaseTruck(job.truckId);
    } else if (e.job.reason === "rtgdropcontainerinyard") {
      const container = rtg.dropContainer();
    }
  }

  private onTruckDriveEnd(e: TruckDriveEndEvent) {
    this.runSequence();
  }
}
