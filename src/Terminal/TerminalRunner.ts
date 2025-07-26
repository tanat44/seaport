import { JobStatusChangeEvent } from "../Event/JobEvent";
import { JobStatus } from "../Job/Definition/JobBase";
import { QcJob } from "../Job/Definition/QcJob";
import { JobPlanner } from "../Job/JobPlanner";
import { JobRunner } from "../Job/JobRunner";
import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { TruckManager } from "../Truck/TruckManager";
import { CargoOrder } from "../Vessel/types";
import { CargoOrders, Vessel } from "../Vessel/Vessel";
import { Visualizer } from "../Visualizer/Visualizer";
import { YardManager } from "../Yard/YardManager";
import { TerminalManager } from "./TerminalManager";
import { UnloadPlan } from "./type";

type QcPlanMap = Map<string, CargoOrder>;

export class TerminalRunner extends TerminalManager {
  qcPlans: QcPlanMap;
  planner: JobPlanner;
  jobRunner: JobRunner;

  constructor(
    visualizer: Visualizer,
    qcManager: QcManager,
    rtgManager: RtgManager,
    truckManager: TruckManager,
    yardManager: YardManager
  ) {
    super(visualizer, qcManager, rtgManager, truckManager, yardManager);
    this.planner = new JobPlanner(
      this.visualizer,
      this.qcManager,
      this.rtgManager,
      this.truckManager,
      this.yardManager
    );
    this.jobRunner = new JobRunner(
      this.visualizer,
      this.qcManager,
      this.rtgManager,
      this.truckManager,
      this.yardManager
    );
    this.qcPlans = new Map();
    this.visualizer.onEvent<JobStatusChangeEvent>("jobstatuschange", (e) =>
      this.onJobStatusChange(e)
    );
  }
  onJobStatusChange(e: JobStatusChangeEvent): void {
    if (!QcJob.prototype.isPrototypeOf(e)) return;
    const job = e.job as QcJob;
    if (
      job.status === JobStatus.Completed &&
      job.reason === "qcdropcontainertotruck"
    ) {
    }
  }

  executeNextCargo(qcId: string): void {
    const cargoOrder = this.qcPlans.get(qcId);

    if (cargoOrder.length === 0) {
      console.log(`Finished unloading QcId: ${qcId}`);
      this.qcManager.releaseQc(qcId);
      return;
    }

    const nextCargo = cargoOrder.shift();
    const unloadPlan: UnloadPlan = {
      qcId: qcId,
      cargo: nextCargo,
      yardCoordinate: this.yardManager.findStorage(),
    };
    const jobSequence = this.planner.planUnloadJob(unloadPlan);
    this.jobRunner.addJobSequence(jobSequence);
  }

  run(cargoOrders: CargoOrders, vessel: Vessel): void {
    // map cargo orders to available qc
    for (const cargoOrder of cargoOrders) {
      const qc = this.qcManager.assignQuayCrane(vessel);
      this.qcPlans.set(qc.id, cargoOrder);

      // execute the first cargo
      this.executeNextCargo(qc.id);
    }
  }
}
