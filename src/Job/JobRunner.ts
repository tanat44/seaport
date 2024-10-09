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
import { ContainerJob } from "./ContainerJob";

export class JobRunner {
  terminal: Terminal;
  qcManager: QcManager;
  rtgManager: RtgManager;
  truckManager: TruckManager;
  yardManager: YardManager;

  jobs: ContainerJob[];

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

    this.jobs = [];

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

  run(jobs: ContainerJob[]) {}

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
