import {
  QcMoveEndEvent,
  RtgMoveEndEvent,
  TruckDriveEndEvent,
} from "../Event/types";
import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { Terminal } from "../Terminal/Terminal";
import { TruckManager } from "../Truck/TruckManager";
import { YardManager } from "../Yard/YardManager";
import { JobSequence } from "./Definition/JobSequence";
import { QcJob } from "./Definition/QcJob";
import { RtgJob } from "./Definition/RtgJob";
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
    this.jobSequences = jobs;
    this.runSequence();
  }

  private runSequence() {
    if (this.completedJobIds.size !== this.jobSequences.length) {
      console.log("JobRunner: all sequence completed");
      return;
    }
    for (const sequence of this.jobSequences) {
      if (sequence.completed) {
        this.completedJobIds.add(sequence.id);
        continue;
      }

      let executeSucceed = false;

      for (const job of sequence.canStartJobs()) {
        if (QcJob.prototype.isPrototypeOf(job)) {
          executeSucceed =
            executeSucceed || this.qcManager.execute(job as QcJob);
        } else if (RtgJob.prototype.isPrototypeOf(job)) {
          executeSucceed =
            executeSucceed || this.rtgManager.execute(job as RtgJob);
        } else if (TruckJob.prototype.isPrototypeOf(job)) {
          const truckJob = job as TruckJob;
          if (truckJob.reason === "truckemptymove") {
            const truck = this.truckManager.getAvailableTruck(truckJob.to);
            if (truck) {
              executeSucceed = true;
              sequence.assignTruck(truck.id);
              truck.execute(truckJob);
            }
          }
        } else {
          throw new Error("Unknown job type");
        }
      }

      if (!executeSucceed) {
        return;
      }
    }
  }

  private onQcMoveEnd(e: QcMoveEndEvent) {
    // console.log(`QC#${e.quayCraneId} - Finished <${e.job.reason}>`);
    const qc = this.qcManager.getQuayCrane(e.quayCraneId);
    if (!qc) throw new Error("Cannot move unknown quay crane");

    if (e.job.reason === "qcpickcontainerfromvessel") {
      const job = e.job as QcPickContainerFromVesselJob;
      const vessel = this.qcManager.getAssignedVessel(e.quayCraneId);
      const container = vessel.unload(job.cargoCoordinate);
      qc.pickContainer(container);

      // qc moved to drop position on truck
    } else if (e.job.reason === "qcdropcontainertotruck") {
      const job = e.job as QcDropContainerToTruckJob;

      // load container on truck
      const container = qc.dropContainer();
      const truck = this.truckManager.getTruck(job.truckId);
      truck.load(container);

      // rtg job 1: move to container handling point
      const yard = this.yardManager.getYard(yardCoordinate.yardId);
      const handlingPosition = yard.getContainerHandlingPoint(yardCoordinate);

      this.rtgManager.queueRtgJob(rtgJob);

      // rtg job 2: unload container to yard

      this.rtgManager.queueRtgJob(storageJob);
    }

    this.executeNextQuayCraneJob(qc);
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
    // do nothing for now
  }
}
