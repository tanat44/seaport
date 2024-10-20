import { JobPlanner } from "../Job/JobPlanner";
import { JobRunner } from "../Job/JobRunner";
import { QC_WIDTH } from "../QC/Qc";
import { QcManager } from "../QC/QcManager";
import { RtgManager } from "../RTG/RtgManager";
import { TruckManager } from "../Truck/TruckManager";
import { Vessel } from "../Vessel/Vessel";
import { Visualizer } from "../Visualizer/Visualizer";
import { YardManager } from "../Yard/YardManager";
import { LayoutManager } from "../Layout/LayoutManager";

const VESSEL_NAME = "Vessel-Polo";
export class Terminal {
  visualizer: Visualizer;
  layoutManager: LayoutManager;

  // storage
  vessels: Map<string, Vessel>;
  yardManager: YardManager;

  // equipment
  qcManager: QcManager;
  rtgManager: RtgManager;
  truckManager: TruckManager;

  // operation
  jobRunner: JobRunner;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.init();
  }

  private async init() {
    // wait for layout to load
    this.layoutManager = new LayoutManager(this.visualizer);
    const layout = await this.layoutManager.load();

    // init vessel
    this.vessels = new Map();
    this.vessels.set(
      VESSEL_NAME,
      new Vessel(this, VESSEL_NAME, 10, 50, 12, 70, layout)
    );

    // init yard, qc, rtg
    this.yardManager = new YardManager(this, layout);
    this.qcManager = new QcManager(this, layout.quayCraneOrigins);
    this.rtgManager = new RtgManager(this, this.yardManager.allYards);

    // init truckplanner
    this.truckManager = new TruckManager(this.visualizer, layout);

    // plan operation
    const planner = new JobPlanner(
      this,
      this.qcManager,
      this.rtgManager,
      this.truckManager,
      this.yardManager
    );
    const vessel = this.vessels.get(VESSEL_NAME);
    const qcPlans = vessel.planUnloadUsingQc(3, QC_WIDTH);
    const jobs = planner.planUnloadJob(qcPlans, vessel);

    // run operation
    this.jobRunner = new JobRunner(
      this,
      this.qcManager,
      this.rtgManager,
      this.truckManager,
      this.yardManager
    );
    this.jobRunner.run(jobs);
  }
}
